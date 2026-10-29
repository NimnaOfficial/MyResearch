# **High-Throughput Processing and Weighted Deduplication of Multi-Gigabyte Password Corpora: A Technical Deep-Dive**

## **1\. Architectural Imperatives and the Theoretical Password Guessing Curve**

The ingestion, byte-level sanitization, and statistical analysis of massive password breach corpora—such as the Compilation of Many Breaches (COMB), RockYou, LinkedIn, and Yahoo datasets—present formidable data engineering and cybersecurity challenges. These unstructured text dumps routinely exceed hundreds of gigabytes and comprise billions of semi-structured rows containing raw credentials, synthetic identifiers, and cryptographic artifacts. Processing these datasets is not merely an exercise in high-throughput data engineering; it is a foundational prerequisite for empirical cybersecurity research, particularly in characterizing the optimal attacker's guessing curve1.  
The guessing curve, denoted as ![][image1], represents the cumulative probability mass of the top ![][image2] passwords in an unknown password distribution ![][image3]. In practical terms, it defines the probability that an optimal attacker, possessing partial or full knowledge of the distribution, can guess a random user's password within ![][image2] attempts1. Establishing accurate linear programming upper and lower bounds (LPUB and LPLB) on ![][image1] requires highly accurate empirical frequency estimates derived from massive datasets1. By applying Kerckhoffs's principle to password security, defense mechanisms must assume the attacker knows the password distribution and consider the guessing curve ![][image1] of an ideal attacker when formulating policy decisions2.  
However, utilizing the empirical distribution derived directly from raw breach datasets introduces a severe measurement bias if the underlying string deduplication is flawed4. For instance, a common heuristic is to estimate ![][image1] using the empirical distribution where ![][image4]. A critical downside to this approach is that the empirical estimate ![][image5] can substantially overestimate the true value ![][image1], devolving into the trivial upper bound ![][image6] whenever ![][image7]1. If the underlying frequency mapping is artificially inflated due to encoding artifacts, incorrect parsing, or memory constraints, the resulting probability mesh is corrupted, invalidating subsequent mathematical models2.  
To compute precise frequency mappings (Word ![][image8] Frequency Count ![][image9]) for datasets exceeding available system RAM, data pipelines must employ advanced stream processing, robust byte-level sanitization, and out-of-core algorithmic architectures. This report exhaustively details the construction of a high-throughput, zero-copy data pipeline optimized for ingesting, sanitizing, sorting, and deduplicating multi-gigabyte text corpora, leveraging external merge sort algorithms, probabilistic data structures, and persistent memory-mapped key-value stores.

## **2\. Encoding Artifacts and Multi-Byte Normalization**

Breach corpora are notoriously heterogeneous. Because they are concatenations of databases compromised over decades across various geographic regions, they contain a chaotic mixture of character encodings. A single 50GB text file may interleave standard ASCII, valid UTF-8, legacy Windows-1252 (CP1252), ISO-8859-1 (Latin-1), and East Asian encodings such as GB2312 or GBK6.

### **2.1 Characterizing and Repairing Mojibake**

When a string encoded in one format is incorrectly decoded using another, the result is "Mojibake." A common edge case occurs when UTF-8 encoded text is interpreted as Windows-1252, leading to single multi-byte characters being expanded into multiple unintended glyphs. For example, the UTF-8 sequence for "é" (0xC3 0xA9) is rendered as "Ã©" in Windows-1252. If this corrupted string is subsequently saved again as UTF-8, the corruption becomes baked into the byte stream as a double-encoded artifact.  
Furthermore, invalid byte sequences often trigger the insertion of the Unicode Replacement Character (U+FFFD), represented in UTF-8 as the three-byte sequence 0xEF 0xBF 0xBD. Aggressive normalization pipelines must detect these anomalies. The recovery algorithm relies on heuristic fallback chains. When strict UTF-8 decoding fails, the bytes are evaluated against language-specific distribution models. If the byte sequence aligns with common Windows-1252 code points (e.g., 0x80 to 0x9F), it is temporarily decoded as such, then re-encoded to valid UTF-8 to preserve the intended payload.

### **2.2 Control Characters and Whitespace Edge Cases**

Raw dumps are riddled with non-printable ASCII control characters (0x00–0x1F, 0x7F) that break downstream delimited parsers and persistent storage engines.

| Artifact Type | Byte Representation | Systemic Impact if Unresolved |
| :---- | :---- | :---- |
| Null-byte Truncation | 0x00 | Artificially truncates passwords in C-style string handling, resulting in inaccurate chunk-level password guessing models and invalid prefix calculations8. |
| Trailing Carriage Returns | 0x0D (\\r) | Artificially inflates dataset cardinality by creating distinct hashes for identical passwords (e.g., pass vs pass\\r), flattening the Zipfian distribution curve2. |
| Non-Breaking Spaces | U+00A0 | Disrupts whitespace delimiter parsing, causing adjacent tokens to be merged into unguessable pseudo-strings. |
| Zero-Width Joiners | U+200D | Alters the visual length versus byte length, corrupting length-based filtering thresholds. |

*Table 1: Critical Encoding Artifacts and Systemic Impacts*

### **2.3 Automated Sanitization Implementation**

The following Python implementation demonstrates a highly optimized, generator-based streaming pipeline for ingesting mixed-encoding byte streams, resolving Mojibake, and pruning control characters. By operating directly on byte chunks, the pipeline circumvents heap memory exhaustion.

Python  
import sys  
import re  
import ftfy  
from typing import Iterator

\# Compile regex for control characters (0x00-0x1F, 0x7F) but preserve newlines  
CONTROL\_CHARS\_RE \= re.compile(r'\[\\x00-\\x08\\x0b\\x0c\\x0e-\\x1f\\x7f\]+')

def robust\_decode\_and\_repair(raw\_bytes: bytes) \-\> str:  
    """  
    Attempts to decode raw bytes using a fallback chain, then repairs Mojibake.  
    """  
    try:  
        \# Optimistic fast-path: strict UTF-8  
        decoded \= raw\_bytes.decode('utf-8', errors='strict')  
    except UnicodeDecodeError:  
        try:  
            \# Fallback 1: Windows-1252  
            decoded \= raw\_bytes.decode('cp1252', errors='strict')  
        except UnicodeDecodeError:  
            try:  
                \# Fallback 2: GBK for Chinese databases  
                decoded \= raw\_bytes.decode('gbk', errors='strict')  
            except UnicodeDecodeError:  
                \# Fallback 3: Lossy UTF-8 decoding  
                decoded \= raw\_bytes.decode('utf-8', errors='replace')  
      
    \# Reverse double-encoded Mojibake using deterministic heuristics  
    repaired \= ftfy.fix\_text(decoded)  
    return repaired

def stream\_and\_sanitize(file\_path: str, chunk\_size: int \= 1024 \* 1024 \* 64) \-\> Iterator\[str\]:  
    """  
    Reads a multi-gigabyte file in chunks, yielding sanitized UTF-8 strings.  
    """  
    with open(file\_path, 'rb') as f:  
        leftover \= b''  
        while chunk := f.read(chunk\_size):  
            data \= leftover \+ chunk  
            lines \= data.split(b'\\n')  
            leftover \= lines.pop() \# Retain incomplete line  
              
            for line in lines:  
                line \= line.rstrip(b'\\r\\n\\t ')  
                if not line: continue  
                  
                clean\_str \= robust\_decode\_and\_repair(line)  
                clean\_str \= CONTROL\_CHARS\_RE.sub('', clean\_str).strip()  
                  
                if clean\_str:  
                    yield clean\_str

        if leftover:  
            yield CONTROL\_CHARS\_RE.sub('', robust\_decode\_and\_repair(leftover)).strip()

By decoupling the byte-level I/O from string manipulation, the data is standardized into canonical UTF-8, establishing a pristine baseline for subsequent tokenization.

## **3\. Filtering, Stripping, and State-Machine Delimiter Parsing**

Once the data is normalized into UTF-8 text, the raw password payloads must be extracted from unstructured database dumps. Breach compilations aggregate data from thousands of unique sources, resulting in unpredictable delimiter formatting.

### **3.1 Unstructured Data Topologies**

A single dataset may transition seamlessly between direct email/password pairings (user@email.com:password123), complex user ID and hash combinations (johndoe12;84920;5d41402abc4b2a76b9719d911017c592;password123), quoted structures, or tab-separated vectors. Attempting to parse these variations using monolithic regular expressions introduces exponential backtracking, drastically reducing computational throughput. Furthermore, regular expressions often fail on passwords that inherently contain the delimiter character (e.g., extracting the password p:a:s:s from user@email.com:p:a:s:s).

### **3.2 Deterministic Finite Automaton (DFA) Parsing**

A deterministic finite automaton (DFA) or a highly optimized state machine provides ![][image10] guaranteed parsing time per line, scanning characters sequentially and transitioning based on strict rules. To locate the target password, the state machine identifies the trailing elements of the line or leverages semantic pattern recognition to classify elements based on morphology.

| Current State | Input Character Class | Transition State | Action/Buffer Operation |
| :---- | :---- | :---- | :---- |
| WAIT\_ID | \[a-zA-Z0-9\_@.\] | WAIT\_ID | Buffer identifier character. |
| WAIT\_ID | \[:,;\\t\] | WAIT\_DELIM | Flush ID buffer, register delimiter type. |
| WAIT\_DELIM | \[a-fA-F0-9\] (Len 32\) | FLAG\_MD5 | Mark subsequent buffer as synthetic MD5 hash. |
| WAIT\_DELIM | \[^\\n\] | EXTRACT\_PASS | Buffer payload characters. |
| EXTRACT\_PASS | \\n | TERMINATE | Yield payload, reset state buffers. |

*Table 2: Conceptual State Transitions for Delimiter Parsing*  
This state-machine architecture ensures that synthetic artifacts, such as 32-character hexadecimal MD5 hashes or automated bot strings, are bypassed, yielding only the intended plaintext payloads.

### **3.3 Semantic Filtering and Entropy Thresholds**

Extracting the payload is insufficient; the data must be rigorously filtered to exclude synthetic artifacts. Length thresholds are applied first, pruning passwords with lengths ![][image11] or ![][image12]. Values below 4 characters are generally disallowed by modern systems, and values exceeding 64 characters are highly correlated with configuration strings or memory corruption.  
Beyond string length, advanced models employ Shannon entropy ![][image13] to differentiate human-generated text from high-entropy cryptographic hashes. The Shannon entropy of a password ![][image14] of length ![][image15], with character frequencies ![][image16], is calculated as:  
![][image17]  
Strings exceeding an entropy ceiling (e.g., ![][image18] bits per character) are flagged as synthetic and pruned. To further refine the password composition representation, lexical knowledge augmentation and Part-of-Speech (POS) tagging are integrated into semantic probabilistic context-free grammars (SE-PCFG)7. Human-created passwords rely heavily on structural patterns consisting of concrete nouns, verbs, and adjectives9. Studies utilizing the Google Web N-gram Corpus indicate that 16% of passwords contain at least one digram ![][image19] where ![][image20], and 40% of these ![][image19] digrams rank in the top 100 guesses for ![][image21] given ![][image22]13.  
By calculating the Jensen-Shannon Divergence (JSD) between the password corpus and natural language English corpora, data pipelines can heuristically filter out machine-generated strings, ensuring the resultant frequency maps reflect authentic user behavior6. This precise filtering yields highly accurate chunk-level password guessing models, significantly boosting the success rates of subsequent keystroke inference attacks and dictionary generation8.

## **4\. Scalable Weighted Deduplication and Frequency Map Generation**

Once the corpora are parsed into pristine, filtered password payloads, the primary computational hurdle emerges: generating a weighted frequency map (![][image23]) across billions of records. Storing a standard hash map of 2 billion unique strings easily consumes upwards of 150-250 GB of RAM due to object overhead and memory fragmentation. For systems with constrained memory limits, out-of-core algorithms and probabilistic data structures are strictly required.

### **4.1 External Merge Sort Algorithm**

The External Merge Sort algorithm provides an elegant solution for disk-based sorting of massive string collections. It operates with a strictly bounded memory footprint while achieving ![][image24] computational complexity and linear disk I/O.  
The process is divided into two phases:

> 1. **The Run Generation Phase**: The pipeline reads the massive text file into memory until a predetermined RAM limit is reached. This chunk of data is sorted in-memory using an optimized radix sort or introsort. The sorted chunk is then flushed to disk as a temporary run file. This repeats until the entire dataset is consumed, producing ![][image25] sorted run files.  
> 2. **The Merge Phase**: The pipeline opens ![][image25] file pointers, reading the first element of each run into a min-heap priority queue. The smallest element is popped, its count is aggregated if it matches the previous element, and the next element from the corresponding run file is pushed into the heap. This ![][image25]\-way merge streams directly to a final output file.

### **4.2 C++ Implementation of External Merge Sort**

The following C++ script outlines a highly performant external disk-based sort and weighted frequency counter. It leverages std::priority\_queue for the merge phase and avoids dynamic allocations in the inner loop.

C++  
\#**include** \<iostream\>  
\#**include** \<fstream\>  
\#**include** \<vector\>  
\#**include** \<string\>  
\#**include** \<algorithm\>  
\#**include** \<queue\>

const size\_t MEMORY\_LIMIT \= 50000000; // Lines per in-memory chunk

struct HeapNode {  
    std::string value;  
    int run\_index;  
    bool operator\>(const HeapNode& other) const {  
        return value \> other.value;  
    }  
};

void create\_sorted\_runs(const std::string& input\_file, std::vector\<std::string\>& run\_files) {  
    std::ifstream in(input\_file);  
    std::string line;  
    std::vector\<std::string\> buffer;  
    buffer.reserve(MEMORY\_LIMIT);  
      
    int run\_id \= 0;  
    while (std::getline(in, line)) {  
        buffer.push\_back(std::move(line));  
        if (buffer.size() \>= MEMORY\_LIMIT) {  
            std::sort(buffer.begin(), buffer.end());  
            std::string run\_name \= "run\_" \+ std::to\_string(run\_id++) \+ ".tmp";  
            std::ofstream out(run\_name);  
            for (const auto& s : buffer) out \<\< s \<\< '\\n';  
            run\_files.push\_back(run\_name);  
            buffer.clear();  
        }  
    }  
    // Flush remaining buffer  
    if (\!buffer.empty()) {  
        std::sort(buffer.begin(), buffer.end());  
        std::string run\_name \= "run\_" \+ std::to\_string(run\_id++) \+ ".tmp";  
        std::ofstream out(run\_name);  
        for (const auto& s : buffer) out \<\< s \<\< '\\n';  
        run\_files.push\_back(run\_name);  
    }  
}

void merge\_and\_count(const std::vector\<std::string\>& run\_files, const std::string& output\_file) {  
    std::vector\<std::ifstream\*\> streams;  
    std::priority\_queue\<HeapNode, std::vector\<HeapNode\>, std::greater\<HeapNode\>\> min\_heap;  
      
    // Initialize the heap with the first element of each run  
    for (int i \= 0; i \< run\_files.size(); \++i) {  
        auto\* stream \= new std::ifstream(run\_files\[i\]);  
        streams.push\_back(stream);  
        std::string line;  
        if (std::getline(\*stream, line)) {  
            min\_heap.push({line, i});  
        }  
    }  
      
    std::ofstream out(output\_file);  
    std::string current\_word \= "";  
    uint64\_t current\_count \= 0;  
      
    while (\!min\_heap.empty()) {  
        HeapNode node \= min\_heap.top();  
        min\_heap.pop();  
          
        if (current\_word \== "") {  
            current\_word \= node.value;  
            current\_count \= 1;  
        } else if (current\_word \== node.value) {  
            current\_count++;  
        } else {  
            out \<\< current\_word \<\< "\\t" \<\< current\_count \<\< "\\n";  
            current\_word \= node.value;  
            current\_count \= 1;  
        }  
          
        std::string next\_line;  
        if (std::getline(\*streams\[node.run\_index\], next\_line)) {  
            min\_heap.push({next\_line, node.run\_index});  
        }  
    }  
      
    if (current\_count \> 0) out \<\< current\_word \<\< "\\t" \<\< current\_count \<\< "\\n";  
      
    for (auto\* stream : streams) {  
        stream-\>close();  
        delete stream;  
    }  
}

Exact deduplication guarantees perfect fidelity, ensuring no password frequencies are lost. This precision is mandatory when tuning password hashing costs via distribution-aware frameworks (e.g., DAHash) or optimizing data storage through encrypted deduplication mechanisms17.

### **4.3 Probabilistic Frequency Estimation: Count-Min Sketch and Space-Saving**

In scenarios involving real-time network ingestion or massive data streams where absolute precision is unnecessary, exact sorting is circumvented in favor of probabilistic data structures. These structures require only ![][image26] space per token and drastically reduce memory footprints, providing sub-linear capabilities for identifying heavy hitters and estimating stream bounds20.

#### **Count-Min Sketch (CMS) Bounds**

The Count-Min Sketch utilizes a two-dimensional array of counters with ![][image27] rows and ![][image28] columns, coupled with ![][image27] independent pairwise hash functions ![][image29] mapping items to a range ![][image30]18. When a password string ![][image31] arrives, the counter at position ![][image32] is incremented for each row ![][image33].  
To query the estimated frequency ![][image34], the algorithm retrieves the minimum value across all ![][image27] hashed positions:  
![][image35]  
Because hashes collide, counters may be artificially inflated by other items, meaning ![][image34] is inherently an overestimation. However, the mathematical bounds guarantee that the estimation error is strictly confined. With probability at least ![][image36], the error satisfies:  
![][image37]  
where ![][image38] is the total number of stream elements processed, width ![][image39], and depth ![][image40]23.  
To monitor cold items and capture high-frequency flows, advanced implementations link two Count-Mean-Min (CMM) sketches via a Randomized Admission (RA) structure23. For a stream containing 1.09 billion elements, standard Bloom or Cuckoo filters configured for a 1% false positive rate (FPR) require roughly 1.2 GB of RAM to maintain deduplication guarantees25. By utilizing CMS, the memory footprint is reduced to mere megabytes, accelerating stream processing to speeds exceeding 1.09 billion rows per second in optimized ADQM environments28.

#### **The Space-Saving Algorithm**

While CMS tracks frequencies, it does not inherently remember which items are the most frequent. To extract the top\-![][image15] passwords, the Space-Saving algorithm is employed19. It maintains a fixed-size dictionary of ![][image15] pairs (item, count). If a new item arrives and the dictionary is full, the algorithm identifies the item with the minimum count, replaces it with the new item, and increments the count. This mechanism ensures that any item appearing with a frequency greater than ![][image41] will reside in the dictionary, providing accurate top-k frequency maps for generating targeted dictionary attacks and tracking password trends over natural language distributions20.

## **5\. Persistent On-Disk Key-Value Stores (LMDB and RocksDB)**

Once frequency mappings are generated, they must be made available for extremely fast ![][image26] lookups during real-time password strength metering or chunk-level password guessing8. Storing these mappings in raw text files necessitates ![][image10] sequential scans, which is computationally prohibitive. Consequently, persistent on-disk key-value stores are utilized.

### **5.1 Architectural Comparisons: RocksDB vs. LMDB**

**RocksDB** operates on a Log-Structured Merge-tree (LSM-tree) architecture. Data is written first to an in-memory MemTable; upon reaching capacity, it is flushed to disk into immutable Sorted String Tables (SSTables) across multiple levels. RocksDB heavily relies on Bloom filters (and occasionally Cuckoo filters) to avoid reading SSTables that do not contain the target key26. Because LSM-trees convert random writes into sequential writes, RocksDB provides immense write throughput, making it highly optimal for bulk insertions and heavy ingestion tasks, achieving up to 8.4x write throughput over baseline systems31. However, read amplification and background compaction can introduce latency spikes during read operations.  
**LMDB (Lightning Memory-Mapped Database)**, by contrast, relies on a B+ tree structure combined with memory-mapped files (mmap). Operating under a Copy-on-Write (CoW) paradigm, LMDB provides fully lock-free, zero-copy reads33. When a process queries LMDB, the OS page cache maps the database file directly into the application's memory space. Read operations bypass the kernel space completely, returning direct pointers to the requested strings36. This architecture makes LMDB peerless for read-heavy workloads where multiple concurrent threads query the same frequency dictionary37.

### **5.2 Python Memory-Mapped Lookup Table via LMDB**

To construct a high-speed lookup table for the deduplicated password frequencies, LMDB is leveraged. The following script demonstrates the ingestion of the sorted frequency map into an LMDB environment, optimizing OS-level async I/O writing.

Python  
import lmdb  
import os

def build\_lmdb\_index(sorted\_tsv\_path: str, db\_path: str, map\_size: int \= 1048576 \* 1024 \* 50):  
    """  
    Ingests a sorted TSV (Word \\t Frequency) into a memory-mapped LMDB database.  
    map\_size is set to 50 GB to accommodate massive corpora.  
    """  
    os.makedirs(db\_path, exist\_ok=True)  
      
    \# Initialize LMDB Environment  
    \# writemap=True leverages OS-level async I/O writing  
    \# map\_async=True removes synchronous disk flushing constraints  
    env \= lmdb.open(db\_path, map\_size=map\_size, writemap=True, map\_async=True, sync=False)  
      
    batch\_size \= 500000  
    count \= 0  
      
    with open(sorted\_tsv\_path, 'r', encoding='utf-8') as f:  
        txn \= env.begin(write=True)  
        for line in f:  
            try:  
                word, freq \= line.rstrip('\\n').split('\\t', 1)  
                \# Pack the string as bytes, and frequency as bytes  
                txn.put(word.encode('utf-8'), freq.encode('utf-8'))  
                count \+= 1  
                  
                if count % batch\_size \== 0:  
                    txn.commit()  
                    txn \= env.begin(write=True)  
            except ValueError:  
                continue \# Skip malformed lines  
                  
        txn.commit() \# Commit final batch  
      
    env.sync()  
    env.close()

def fast\_query\_lmdb(db\_path: str, target\_password: str) \-\> int:  
    """  
    Demonstrates zero-copy querying of the LMDB instance.  
    """  
    env \= lmdb.open(db\_path, readonly=True, lock=False)  
    with env.begin() as txn:  
        \# txn.get returns a direct memory pointer to the mmap file  
        result \= txn.get(target\_password.encode('utf-8'))  
        return int(result.decode('utf-8')) if result else 0

By leveraging mmap through LMDB, applications running advanced machine-learning algorithms or probabilistic context-free grammars (PCFGs) can access password frequencies with near-native RAM speeds, circumventing the serial overhead of traditional SQL databases7.

## **6\. High-Performance Implementations and Benchmarks**

The computational demands of processing 100 million to 1 billion records expose the fundamental architectural differences among Python, C++, and various database engines. Evaluating these tools systematically dictates the pipeline design.

### **6.1 Database Engine Performance Profiles**

For ingesting 100M+ unique strings, standard benchmarks reveal drastic latency disparities depending on the underlying data structures39.

| Data Structure / Engine | Ingestion Speed (100M rows) | Query Latency (Single) | Memory Footprint (RAM) | Persistence Mechanism |
| :---- | :---- | :---- | :---- | :---- |
| std::unordered\_map | \~8-12 seconds | ![][image42] ![][image43]s | High (\~10 GB) | None (Volatile) |
| Python dict | \~30-45 seconds | ![][image42] ![][image43]s | Very High (\~15 GB) | None (Volatile) |
| SQLite3 (Optimized) | \~4-6 minutes | \~50 ![][image43]s | Low (Disk-backed) | Disk B-Tree |
| RocksDB (LSM-Tree) | \~20-30 seconds | \~10-20 ![][image43]s | Low-Med (MemTable) | Disk SSTables32 |
| LMDB (B+ Tree, mmap) | \~15-20s (Pre-sorted) | ![][image42] ![][image43]s | Very Low (Zero-copy) | Disk CoW Tree35 |

*Table 3: Comparative Performance Matrix for 100M+ String Ingestion and Deduplication*  
While Python's in-memory dict is fast for insertions (![][image26]), it is notoriously memory-intensive. Inserting 100 million strings consumes approximately 15 GB of RAM due to object overhead; eventually, the OS triggers page faults, causing massive slowdowns. Similarly, while SQLite3 offers excellent portability, it is heavily constrained by I/O bottlenecks. Even with extreme tuning (e.g., PRAGMA synchronous=OFF), SQLite3 struggles to ingest 100 million rows under several minutes due to continuous B-tree rebalancing and disk syncing. Polars and Apache Arrow provide exceptional vectorized query speeds, allowing filtering thresholds to be applied instantaneously, but remain entirely in-memory by default, risking RAM exhaustion on 50GB+ sets without specific streaming APIs.

### **6.2 SIMD-Accelerated String Parsing**

When executing line splitting and delimiter extraction on terabytes of data, character-by-character iteration via CPU scalar instructions becomes a primary bottleneck. High-throughput pipelines resolve this by deploying Single Instruction, Multiple Data (SIMD) frameworks.  
Libraries utilizing vector registers (e.g., AVX-2, AVX-512) evaluate 32 or 64 characters simultaneously. Instead of looping through a string to find a colon or a newline, a SIMD instruction loads a 32-byte chunk into a vector register and performs a bitwise comparison against a vector filled with the target delimiter. The result is a bitmask pinpointing the exact byte positions of all delimiters within a single clock cycle. This architectural shift from branching scalar loops to branchless vector bitmasks yields 3x to 5x throughput increases during the sanitization and state-machine parsing phase39.

### **6.3 Multi-Threaded Producer-Consumer Pipelines**

To saturate the CPU and maximize SSD I/O, the ingestion pipeline must run concurrently. Python's Global Interpreter Lock (GIL) fundamentally throttles CPU-bound string processing. Bypassing the GIL requires a multi-process producer-consumer architecture, commonly orchestrated via multiprocessing or distributed frameworks like Ray.  
The optimal design establishes a single Producer process dedicated solely to reading massive chunks of byte arrays from disk, saturating NVMe/SSD read speeds. These byte arrays are passed over zero-copy shared memory or fast IPC channels to a pool of Consumer worker processes. The consumers decode the bytes, execute the Mojibake repair algorithms, apply length and entropy filters based on natural language divergence, and emit the cleaned payloads. Finally, the strings are streamed directly into the C++ external merge sort executable via standard input (pipes), completely insulating the heavy string processing from the disk I/O bottlenecks.

## **7\. Conclusions**

The rigorous statistical analysis of empirical password datasets hinges fundamentally on the uncompromising engineering of the underlying data pipelines. Deriving accurate linear programming upper and lower bounds on attacker guessing curves (![][image1]) necessitates highly precise frequency distributions, meaning that data processing cannot rely on naïve text ingestion1.  
By layering heuristic Mojibake repair chains to sanitize corrupted encodings and executing deterministic state-machine parsers to isolate payloads, the integrity of the base data is secured. The application of semantic filtering utilizing Shannon entropy and part-of-speech distributions ensures that synthetic artifacts are successfully eliminated7. Expanding this capability with C++ driven external merge sort algorithms allows for exact, ![][image24] disk-based deduplication without violating stringent memory bounds.  
For scenarios demanding near real-time insights or scale beyond 1 billion elements, probabilistic structures like Count-Min Sketch and Space-Saving algorithms mathematically bound the error of frequency estimations, providing critical optimizations over exact tracking while maintaining minimal RAM footprints20. Finally, transitioning the aggregated frequency maps into persistent memory-mapped architectures like LMDB guarantees zero-copy, microsecond-latency lookups33. Together, these architectures ensure that state-of-the-art password cracking models are trained on pristine, scientifically rigorous frequency distributions, effectively neutralizing the advantage of profit-maximizing attackers and validating policy decisions derived under Kerckhoffs's principle1.

#### **Works cited**

> 1. Towards a Rigorous Statistical Analysis of Empirical Password, [https://arxiv.org/html/2105.14170v2](https://arxiv.org/html/2105.14170v2)  
> 2. Towards a Rigorous Statistical Analysis of Empirical Password, [https://arxiv.org/pdf/2105.14170](https://arxiv.org/pdf/2105.14170)  
> 3. Towards a Rigorous Statistical Analysis of Empirical Password, [https://par.nsf.gov/servlets/purl/10404201](https://par.nsf.gov/servlets/purl/10404201)  
> 4. Reasoning Analytically about Password-Cracking Software, [https://www.researchgate.net/publication/335862062\_Reasoning\_Analytically\_about\_Password-Cracking\_Software](https://www.researchgate.net/publication/335862062_Reasoning_Analytically_about_Password-Cracking_Software)  
> 5. NEW THEORETICAL TECHNIQUES FOR ANALYZING AND, [https://hammer.purdue.edu/ndownloader/files/45842982](https://hammer.purdue.edu/ndownloader/files/45842982)  
> 6. Modeling Human-Created Passwords through Two-Stage Learning, [https://arxiv.org/html/2407.14145v1](https://arxiv.org/html/2407.14145v1)  
> 7. Semantically Enhanced PCFG for Password Analysis and Cracking, [https://www.researchgate.net/publication/371506343\_SEPCFG\_Semantically\_Enhanced\_PCFG\_for\_Password\_Analysis\_and\_Cracking](https://www.researchgate.net/publication/371506343_SEPCFG_Semantically_Enhanced_PCFG_for_Password_Analysis_and_Cracking)  
> 8. Chunk-Level Password Guessing: Towards Modeling Refined, [https://www.researchgate.net/publication/356202012\_Chunk-Level\_Password\_Guessing\_Towards\_Modeling\_Refined\_Password\_Composition\_Representations](https://www.researchgate.net/publication/356202012_Chunk-Level_Password_Guessing_Towards_Modeling_Refined_Password_Composition_Representations)  
> 9. Overview of Word Classes in English | PDF | Part Of Speech | Verb, [https://www.scribd.com/document/821735027/Types-of-Word-Classes-Parts-of-Speech-Open-Class](https://www.scribd.com/document/821735027/Types-of-Word-Classes-Parts-of-Speech-Open-Class)  
> 10. (PDF) Parts of Speech in English Grammar \- ResearchGate, [https://www.researchgate.net/publication/359843201\_Parts\_of\_Speech\_in\_English\_Grammar](https://www.researchgate.net/publication/359843201_Parts_of_Speech_in_English_Grammar)  
> 11. (PDF) Chapter 4: Morphology \- ResearchGate, [https://www.researchgate.net/publication/317426738\_Chapter\_4\_Morphology](https://www.researchgate.net/publication/317426738_Chapter_4_Morphology)  
> 12. On the definition of word classes \- ResearchGate, [https://www.researchgate.net/publication/323425374\_On\_the\_definition\_of\_word\_classes](https://www.researchgate.net/publication/323425374_On_the_definition_of_word_classes)  
> 13. We consider not only how guidance affects password strength, but why, [https://www.blaseur.com/papers/artposter.pdf](https://www.blaseur.com/papers/artposter.pdf)  
> 14. ENTROPIC ANALYSIS OF THE ROLE OF WORDS IN LITERARY, [https://www.worldscientific.com/doi/10.1142/S0219525902000493](https://www.worldscientific.com/doi/10.1142/S0219525902000493)  
> 15. arXiv:1203.1889v1 \[cs.CL\] 8 Mar 2012, [https://arxiv.org/pdf/1203.1889](https://arxiv.org/pdf/1203.1889)  
> 16. Empirical Study of Distribution of Letters in English Words: A Special, [https://www.academia.edu/32396622/Empirical\_Study\_of\_Distribution\_of\_Letters\_in\_English\_Words\_A\_Special\_Case\_of\_centograqs](https://www.academia.edu/32396622/Empirical_Study_of_Distribution_of_Letters_in_English_Words_A_Special_Case_of_centograqs)  
> 17. DAHash: Distribution Aware Tuning of Password Hashing Costs, [https://www.researchgate.net/publication/348803152\_DAHash\_Distribution\_Aware\_Tuning\_of\_Password\_Hashing\_Costs](https://www.researchgate.net/publication/348803152_DAHash_Distribution_Aware_Tuning_of_Password_Hashing_Costs)  
> 18. arXiv:2501.02350v1 \[cs.CR\] 4 Jan 2025, [https://arxiv.org/pdf/2501.02350](https://arxiv.org/pdf/2501.02350)  
> 19. Security-Aware and Efficient Data Deduplication for Edge-Assisted, [https://www.computer.org/csdl/journal/sc/2023/03/09846919/1Fu4xSPpIXu](https://www.computer.org/csdl/journal/sc/2023/03/09846919/1Fu4xSPpIXu)  
> 20. Frequency aggregation overview | Tiger Data Docs, [https://www.tigerdata.com/docs/reference/toolkit/frequency-analysis/freq\_agg](https://www.tigerdata.com/docs/reference/toolkit/frequency-analysis/freq_agg)  
> 21. Stream Query-Processing Architecture. \- ResearchGate, [https://www.researchgate.net/figure/Stream-Query-Processing-Architecture\_fig1\_221103062](https://www.researchgate.net/figure/Stream-Query-Processing-Architecture_fig1_221103062)  
> 22. Structure of a FM Sketch. \- ResearchGate, [https://www.researchgate.net/figure/Structure-of-a-FM-Sketch\_fig1\_325420231](https://www.researchgate.net/figure/Structure-of-a-FM-Sketch_fig1_325420231)  
> 23. Efficient and Secure Traffic Scheduling Based on Private Sketch, [https://www.mdpi.com/2227-7390/13/2/288](https://www.mdpi.com/2227-7390/13/2/288)  
> 24. PM-Dedup: Secure Deduplication with Partial Migration from Cloud, [https://arxiv.org/html/2501.02350v1](https://arxiv.org/html/2501.02350v1)  
> 25. Statistics For The Health Sciences A Non Mathematical Introduction, [https://www.scribd.com/document/1022004773/Statistics-For-The-Health-Sciences-A-Non-Mathematical-Introduction-1st-Edition-by-Christine-Dancey-Richard-Rowe-John-Reidy-ISBN-978-1849203364-18492](https://www.scribd.com/document/1022004773/Statistics-For-The-Health-Sciences-A-Non-Mathematical-Introduction-1st-Edition-by-Christine-Dancey-Richard-Rowe-John-Reidy-ISBN-978-1849203364-18492)  
> 26. Bloom Filters in Distributed Systems: The System Design Interview, [https://spacecomplexity.ai/blog/bloom-filter-system-design-interview](https://spacecomplexity.ai/blog/bloom-filter-system-design-interview)  
> 27. Bloom & Cuckoo Filters · Subroute, [https://subroute.dev/topics/bloom-filters](https://subroute.dev/topics/bloom-filters)  
> 28. Improve SQL query performance | ADQM Arenadata Docs Guide, [https://docs.arenadata.io/en/ADQM/current/how-to/performance-tuning/improve-query-performance.html](https://docs.arenadata.io/en/ADQM/current/how-to/performance-tuning/improve-query-performance.html)  
> 29. c\# \- Parsing one terabyte of text and efficiently counting the number, [https://stackoverflow.com/questions/12190326/parsing-one-terabyte-of-text-and-efficiently-counting-the-number-of-occurrences](https://stackoverflow.com/questions/12190326/parsing-one-terabyte-of-text-and-efficiently-counting-the-number-of-occurrences)  
> 30. An Exhaustive Survey on P4 Programmable Data Plane Switches, [http://ieeexplore.ieee.org/iel7/6287639/9312710/09447791.pdf](http://ieeexplore.ieee.org/iel7/6287639/9312710/09447791.pdf)  
> 31. Database Internals: A Deep Dive into Distributed Data Systems, [https://studylib.net/doc/27919246/database-internals](https://studylib.net/doc/27919246/database-internals)  
> 32. Tidehunter: Large-Value Storage With Minimal Data Relocation \- arXiv, [https://arxiv.org/pdf/2602.01873](https://arxiv.org/pdf/2602.01873)  
> 33. Available software \- Alliance Doc, [https://docs.alliancecan.ca/wiki/Available\_software](https://docs.alliancecan.ca/wiki/Available_software)  
> 34. The Design and Implementation of FusionDB | Evolved Binary, [https://www.evolvedbinary.com/publications/the-design-and-implementation-of-fusiondb\_february-2019.pdf](https://www.evolvedbinary.com/publications/the-design-and-implementation-of-fusiondb_february-2019.pdf)  
> 35. designing data intensive applications \- GitHub Pages, [https://0-lucas.github.io/digital-garden/99.-Books/Martin-Kleppmann---Designing-Data-Intensive-Applications\_-O%E2%80%99Reilly-Media-(2017).pdf](https://0-lucas.github.io/digital-garden/99.-Books/Martin-Kleppmann---Designing-Data-Intensive-Applications_-O%E2%80%99Reilly-Media-\(2017\).pdf)  
> 36. Ikey | AerynOS, [https://aerynos.com/blog/authors/ikey/](https://aerynos.com/blog/authors/ikey/)  
> 37. Advanced Prefetching and Caching of Models with PrefetchML, [https://www.researchgate.net/publication/323537573\_Advanced\_Prefetching\_and\_Caching\_of\_Models\_with\_PrefetchML](https://www.researchgate.net/publication/323537573_Advanced_Prefetching_and_Caching_of_Models_with_PrefetchML)  
> 38. Database implementations — list of Rust libraries/crates // Lib.rs, [https://lib.rs/database-implementations](https://lib.rs/database-implementations)  
> 39. Algorithms — list of Rust libraries/crates // Lib.rs, [https://lib.rs/algorithms](https://lib.rs/algorithms)  
> 40. Password Strength Signaling: A Counter-Intuitive Defense Against, [https://par.nsf.gov/servlets/purl/10322479](https://par.nsf.gov/servlets/purl/10322479)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaCAYAAACtv5zzAAAB/ElEQVR4Xq1UPyhFURj/TrxCqSeGNyhhs78MYrCTAYPBoEzKymywvzBZxaKUklAySBlMr5SUURYZZFCv+H3nz7vnz3fvNfjV73zn/L7fd+6555x7iTyo3EEoJKkAxdkMvi+3RplUbl6E4JZeLQxBLxfO4hdJZcWrlhKZVsWghdhwqj+Z9CIpchMOqgnLMzqDcSaAP49dRTp1tCQ73AFbGCwZ1TXlcLYy+xT4CR6DlShH5eXJuhNUod0hvoJjWpEqhC0SkSNvIfGDuJ5JslNWy1EH38FzTNAdJ2W4M5QOWyNITJJ5ALMe74qNHeAMeAbeQr1EXAM3wJ7AGQ7UBJpH8AD8UbxdkQMYBm+g7CL2e4lpMrfQQvlFuscrWrEDvkFHZG4U3yyHC/CU5K3jutFYdJgHPyh8ryXF3wTRnqd/ozPneSz0FrNHRYvWWMDgC3E/lFUNTdNQ1az+QoVfub8+gxq0J8QrMv8iP8eDBlq8hVpGvxPxGmKvZxsBT8AH0r8YNd7OWLB1AOxKVNPwWfCb9NnEfdYPsKnMA2KdhEVHCKU3pbc0AB/4OZnfizRDiGKDmiVzDnwdF8FVFBwibitzA62t3fsDUnMF2hAifzO8vdmGOqQ1mZa6Q0HOi5KPYHrRnUqp8g/IX4BDQcqgzFCW15BMRvMz+a4iaIdtfgEwrDbgj+Z+pwAAAABJRU5ErkJggg==>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAABkElEQVR4XqVTLUtEQRS9g2ww+AFiWRA0CCIYTAbBKiaTBsFi22Twb9iM2wSDshajC4IgBptFEMRkMLsGg7CeO1/v3vl4xQPn3Zl7ztw7M+89Ioaxzwg5teMWXaEqWLSrxIZgyaxqG96nzNmKBEpvGtWwAj7A9Y14Dm6CXSxcx8IbjK/BCwplZTXjpl/gEFzQ3ex4DoMx2CscwRr2MBgizopFEX48QtxKk4wN8BNcalIeTRfGMzgfNQtDk3jw+cbRqIPEAOykyR1Yf2B+T4W8gFnUU/c4I3c5g2JrfYQMU9DuyBU40VJpUZ7rIveGOIa0ywlh4dd2i8QjYh/5PuIT4nJ0GHchfDFc4DDt4GfTGN0jjpTIqjccgL/gFWey4xOtkXvFr6kQIu+Ct8dFOskpZ2DCp2v8JdeBb4FOYfwg9w9wwUvwhewOzTHikfAL6JbbmO6T4yo4EQRnK/2NKlO8xNZMRItkEXbQhJbODtJcsctk6CCL5/q/Ub3E0p4kKrpa22T0rHAcnfEuNy24ky5y+gfoTC6t3DyygAAAAABJRU5ErkJggg==>

[image3]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAZCAYAAAA4/K6pAAABdUlEQVR4XoVSu0pEMRCdIAtuIdipi8WineAPaGMhNhZaaG9ro2AlgrUfIHZbiBYKfoCFIIitoJWlhX9gISwo6JmbyU0mmeweOJlkzpnJ415yFJHO9cJAXdeK5bNylKarpyoyYZ65mmVZKRCh1F0XuUNM/kbwB745b5dBGi2Bb+AA3BPzHdQe9B7mq+C1axo0vhlf5tEH32G+IN9yh3yD89YhuyHsYvILbqbaKcIzOC+nOSbfYF+KopNoUrQt6w1C7gpxiLihZGpaoIH7wHQh1xK4Jwyf4GKW52EZPAmLNgTIkosfsZhSItE0+CBREBrER+LIj3QmCmMCwjryr5hf1jZPwfc/Am9Bvu83+IKKNWq3SpA14jvegB2d9qhvGpUDcDvLFVvWTtAF78HZmMrMAivHWAG/ICe6ZbVyHvzr8n9ehS+tN+Dvaz5ejtgia2b1Ts3qBEEoi8RYCi2UPs4cEb+IspdHHI+KL201GsoZr2CXlZL2/QN6VC5BD1TV6gAAAABJRU5ErkJggg==>

[image4]: <data:image/png;base64,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>

[image5]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAaCAYAAACtv5zzAAACLklEQVR4Xq1UzUvVQRS9lzAIUnqvQAshy41S4UoCg5ZCuxYJJbxdLtqEgn+BLlq0ijAQEVxIQesgIsiIiGoVCG0CF7kJokWB0CKoc3/zdefrvSd04MzHOXfmzsxv5kfkwa7RRmsqdJ3lBFtrP0FkhY6fYAfFL/BmZKcJNHrmDM5pcBGcAD/AMEnqIw2iHVbRBMy5BtAGV9E5GUWoulu7N/Sq+luhRzUSxhlUC6RW7YxKpz5ZA84WNwB+Az+Bw17tC91TUQjgNbT+oHs9shVqUxm95nrwLIrfiHtCZkdOD02F5AQCcs0rLW6uKH0Fx4NfGmMRZUmiKoNWYPxFfSdI5ciySmVDneEM+BN8Dh7Tboqy2gMYNIjiFZkbdcmp0WSmM4lqHfVHUOIfgrfBCyEwh/zsXmKCx5hFErwDTyhfPvwGSUysW/AW+40V98evyUwwBD4jOSqWI/PBy+A+uhed4GCPuJMqujuKchvN41aaJ3kTRPesL9hDvZWeWAAPNIZzVdQYmRest30e3EPQLuoRq0nCGyGkB2yCMfCzpU4qzTWSh0d8zWo/wOkQQkfB++Bb8AvilpTnsUnmxlxODWSQl30APuXmA7MkuOrdAEn6PVNtZxBsaV1BQk6R+fkdAd+TXALWvxEB3yXz+rWW1OVuAj6H4g34Auwg9hbqR2QuwgMdmaG0tYokd0h2dQU8S/anGK03H58rZa2mlsBxtn4HZnGJkPkGpahDZv5fOEy+f04uPnJ2nUyVAAAAAElFTkSuQmCC>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAAaCAYAAADv/O9kAAADSklEQVR4Xs2WS6hNURjHv5WU9ysiKTEgMjBwU+SOPEbSLRQDSSkZeAyVDO5AlNIlGShJxECmBoqUZOCRR7eEzMxQZKb4f3utffZ6fGutvc4+p/zqf/bZ32Ot9a3H3puoX5RvEE3/KamRpnwWQVhgSFEUnKXP1vpM64Tpc1hdD7TdaGMq7jI0/lykhxAemkJLCfOgP9AEmZa6NSfkB4Ysq6gsazp0Crqmb1Opru8d9BFa5juiJMISrgrb78XOgk5AJ6GpritgPnQBeg39JL14N52ImsSALpNO3O87upLo02YudAaaJF14G3iVt0HLoU3QN4oVXlGPxB3RKG5/4XqP8jOdIV+qFbEUugi9gfaR6TvWQswORsgrPBFro/icP4O+QmulJMnWgZXQDdLbdAya4ngtWvbbFJ5NqAKcqHHc/sX1mG10CBoNDEl0tLqPn+fQVvyPFhyS7CtY8RJG0DYnPyB9fqLIQ1AxR22fCXHR6ytLLNYjXB+RToVvIZ3M4obI7tH84zN5lvSxeAydhxZAx801xxq0ZFY7vr37IF24NHHGtpn4iaroFq683cetkDroIPQWN9upGfQK6BXp8yo1r3E9fL6vQy+gMWVNgBMWb00ChSux8GbHqKDNndAh4+an6h3ST/hRNpnYddABE+9zlHo7JKTF+P1XGb/LS4msuN27O5LduP3hWfldzu/0K2w3Dn7PL2lCHObQYLYtF3wYmlR6MsgfrEOzlEykcIPXzB7oN/U+83pwgfwlx+L/XNgTstLj85iiiczk8K67iqAZviMBjqr6jutdyiwCF/QBekj6W92GxzWBX6y64u3ND7RPPY/mNPSU9GfuS2hHzyORqTTrl5kNPSL9TJK0S2qYLQuhab7DwLPOk8Pfw3UHPhuhL+ZaQP5NlvQnnTUtglqEMPwAW+zZ+EOHPzUXefYoYV+hRaRl2DDgHfAeOoJR7MX1EukH3jlqMywdwWf2NvRZlrLvOa7kjA+GSCW85TdAqyl+RMjPbu4irbYmf0QKKBxWFRSL9OyxsARhim0x/8MggVZBAyQ5MR1o1aQcJFtF3NCCRJGu+cWYyQ/7VfnBSP7GJnkzOClCvmAK8YKEHMHUkiAzMAyfoi6LgukfiHFs++ljOUYAAAAASUVORK5CYII=>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAD4AAAAaCAYAAADv/O9kAAADqUlEQVR4Xr1WS6hNURj+d1y5eSd1u10DSaEkI7eUkZIkJRTFQEp3RJnIwMCEgQnKxEQkz5AJkbdkYORKKdfI4IyUx8BA8X17rX3WXu+9zz3HV99ZZ/2Ptda//vXvtUSaoFA/ZZODtv3/iK0vLJ02wnFWAt16+t7gDWMJPG0YzcyaWVXIrcOIAkoJ6z1LTzAgNJqnkVEO9UFix7YpEt4J1UrwNfgLvAxuAEfBdeB98DR4VfQQiXGGXUGfsAw8B94Ff4N/bbXMBo9jXR/Q/gE7+H/DsdGwTlbxA+1jcGlXYZrF+HmLvxPaPgam7CPaE0KfwWAr+B78Do44OmIMfAWucBUqTN1q7BIV9MKuhLDTegzcWHUSGR8Cd4DvwAvgaMK2F5wCD4EPwL1qry1wjVcg5zqSWA92YMijZMMecTu4xJJoWGZ6R9HMwJ9NIE/KHXBV3SyM7BbNAa+Dq6UMWt6ImyyRo5pJoB4L1q9bLyEw8Pgu+tHXO+PgS1FZWltXtsRy8CY4X9QxZ61vMeoyy8i2OZkx0InOXxrs9phTHm0Bz4JBM/hxdlyDBmB9n615MmHXxCRkBKqHbLsWEZzH/HS+7SoGjKfgE3CRLXbq1duagvW9sybokDBbo/u6vhMnE5gnagEMPFET3uwJmDwaLy8UZp3HnsffSXxyLl5Xl4T1bcyYba7/pO4zjgmlj4/FO/qzKEfWbx28ih6J+nhc1LwnsSsiAEfKLgN9LuXpCvtkYOq7ci+6pTop5TVWZOpbOfI4cBEMfJ+lN+BH5AX4U0IDxneWY+8BeaeXV5qtthEcwUVRXmO1Y96Nfr+oBwvfIfV6D8DMxCuBTtzJEFg7rKNPoj4cGvZSHflBUQHzEbPAtU0jasuyvAU9rzEX/JBNwpUJzD2wNIpyd3iMGby7U1h0+UStPn5D0WUZzASPgHNdRTymqKIC3wPbRD1FQ4ETrPFvot4kjTGMqc+g/Srqjc6N4BuXWeOJOAweMOb9RjhwLWUGufF18lszq7IjCnUyn0n1wCqdY+fTQ7EZP7s1ubPc6Zra6jWDswCDkEwhrmmCkLeWhVQVwnvkeKQGcOEFHp7BICSNLdwTROC95StExG1hhplCZ0q1Li053xDBt38Kua0r4Wx4wtJFC9MGyI2W05cIGcUOQ78x8An6AH+NviSPXnxao90k1gHOuGbUDQz6hmqmfsxoAm8/muWRcQ+pm8pqSKvT2unDGT+aB0+QQ2TggMBTtUGbhIlt8Q+Cann2cHaEsAAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAZCAYAAADe1WXtAAABUElEQVR4XpVUO04EMQwdF0g0KyGOgMRNEGeggCtAS8MNKOiXEhrE2TgDL46d+JdZeJKT+D3/Jjs72wZQW/ZAMaZ5VRYZdpz0YBKKfBcuTtWCsRScEqtUWRUHkmKuIhZTX10zvUPF1eQKOlLCil8pna01xUplflesEa7JQV6ae9iNECpM5MQQpTfvA29hb13oi5Nz0QZbpB/sChxgn7BrT5dJjjK+Jca5TftthIzczPrtJoNA3OkRyyUHiaxRZ7An2BHMkXcx4p2Y7+ekv2P/gb20Oq2gzFDBs3XMdgH7GlqY1JOLCiG4ua/Y7xx9GrZM6nQF+wB9mIoZNYXvF1M8wJ6nG+Kcyw65pu4soP6enhfJf4T9lsUuZghfsmgQf6wiZCB/P/eiDU5PkQ7JMVjxEzooR9LISH9AgQsP/NzjVSWsyv8fPIzvniCPVU81HnjgF+WAEi0cGYeGAAAAAElFTkSuQmCC>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAaCAYAAACpSkzOAAACZUlEQVR4XpVWPUsdQRS9g1hIkKhBBImgqYIIwcJYiJYvpBIERYT0SaOFIBZ2aQzYJV0iiKCCpEmwCQGbiFjoPxDTppYUKQLJufM9d+6+p4d3duae+7Uzu7M8IoaJl2YId4fozO9nZYKersYUYjAMGc1d162EpKgFajvr2ezLLdmgER39WWeBp+AZ+Bvch3sG4zA4CX5FwjbGg+qG2SqUSsht2/4W/A5tJDpS/CNMLzC+iYqCchF6s0XiJkR9SSpnwCY4lwtVMVk7B3zTGH6BY1HRMY93a1CKWjRrUXcT00N2/+lf0JMvTGLaPNhdBgT4akLN8RL8A95Ih93vLBPTx8lKaFc8wdB7cqv5LF056mK1UiPF9IKnhhsZWk8BAUoxRdLhA+1gcEYMXZNbEe9/OwwiZ0qKRuxtPs13nsc9co1eOSF3xcwh8JjSM+IXos/frENq0lst2ge6l8HYQsJpwUU/kDtnjFHwHXiCkBWv8XgEPiR3FiN8GcM/LvQR/At2ZTHsHwAPMVllw0n0Gtdx8IT8LkDbxXXL5yx7rYS3+SztgD+h7JNr/AU8g3+2iCR6gPkzmJeYPwH7wR9gy4fw4Xew67CjbEsvIC1BXQDHQpwC/t7xceDd4A/uFYXnZ8J2NqXeD/zN4x1gtMBvZI+K4eOyFqMkit52GX4t1U1F4Tm57eLn9Qk8BzfAt+BEndcR2csev/9OJ7dt/IHlF4iFAeIXS22iikEuC0dL5lhbiIXpjfSHQlawYpbk/nyUUUqOjjsHWoRnFxbRnN1uhd4uNBlgoYqxe+UNQnQ0dRABephcQbJ5+h/sZzfi7Kq2dAAAAABJRU5ErkJggg==>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADQAAAAaCAYAAAD43n+tAAAD9UlEQVR4Xq1WTYhPURQ/N41m8tGgiSSNwcYOiSzYkSxIxkKNLGxmY0uyoUR20mhKahLylTIpSQlpaiQlSj4TNSlGWSgLNX6/e959/3vve/f/3n/+86vfu++dc+459+Pcc58IYfLH9FGze02zBNrr3Rr8WLXj1jZsFS04bsG0YVvRyamztsK6fbQYgOaDsbCAuk6NzIbpabyti1U1YKPsBr+Bh8BV4FPwCXgD/A5Ogf1l44FsG5pxcHGsA3aCF8HnRn1sjvQrwBF4YYx/4Bs4XOrpm/m2KEsIvr4XuxqmF+1r8Bg4K9N3w+Ih2pfgokzmwO8x8EAkD4AAw3iw/xC+TBwc3IvmJtjR0Fjwm/JTEvRqjn6YbkQ7D3wAPkaI7tDEruwvyGnnYz/4Clyin9FItV2A511wD/gZ7PPVGZheA/paGDez55Nk/XIUzBTrRVOKaq7yH3BHYEHooJgyuzwpV+82lCPWIo214BXRBaOPk6Fa5oC3RO0sImfLwA+ST7iBOGgHJNxOrhrTiufmrJXHMPlg/AmtBL9KSaAoFPXHs/e/oint7yj9cAe5aGXoBO+BV6U4hwBII/Nb7KGsBCc0CW8bPBkP7CS4xQkS0YaN2hI8bzz8TFUHVzhS/Qmm5LhJT9riqOiqN8pt2mOP6Fnp8UwGYP9DvFRx8Gw4gDtG04Y4LBrzPtiVyfLzE4f3vjlWZpLzk8PZsOUWZmlkmnoT3ZmhXKpPBvkI+mU2xhqjGdCZdepDw4ExM1hoeH6u0y7vUQ6mOrPBz5AATKFHCBKfiwD5nIw9yN4dYjV1JuSfH4IduTCIa9iuFp4fLTrN4E0oXnlCZefBKaPb74l9GBaIEch5D/lyPpJpkMGmm1h9kAHubuFi/hQ76UBfhkGoJ0zFTrI8s+qQIdQ5c/yS6E1dNuiqNKD8mmiVisfrYk9IxSAzcPHeSV4dG/D9csCjoml3QjJjowPgzf3WMP+NzPX6ZLBuWAx4h7FKxWCfM6Ll2B1+H7wmxoz+Xs2PlTFgd1m0dNvFccIyLJTG9juyrD4DN4Em0Y9wlc8/I/bOMKE/kv+IMVjxmPZVYOoyS6ILOT0yavhbsg/cLly9CGHX4IsD8ktwA+l4FhVqH0zdL1L8sfV9uFe2CdcFcUFAJIOVRSuFKeqj/1DuzCgkXbFdE6iLFjo4sMs50eJhf5ma+igoQ0EwBn1ZDr4AtzpxJXyXkbO6WGS0rLvfmwylnlsBF+gCeESm6aC4S0k3YVLgvVfsn3cCST9JFcUHRXe/+LM8E0gELkVsG39X716ZbFpIOwo1JXYlolKZB6qrpmaRVMSqJoZVaM9Re73bRx7RC50aRUo+g3AhXPsfRSCXr36ZV54AAAAASUVORK5CYII=>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEEAAAAaCAYAAADovjFxAAADpklEQVR4XuVYT4hOURQ/N02ZIgklzc5ObKxlSvZGSbGwYmOllCZFCtlYKGUzipSFDCtZahazERY2IpIUKVkg2ajP77xz73v3z7n3vftmsvFrfn3vnn/33vPOPff7hmjVYGKBhVE1jUxTjMVqxkowKvgQJ7HxLfl5iKePGvt0xnQYoqDMq+ItKWjEmk6TZZA1zSpCWDPN+jC4JxaOxEbwLLg2VjC0yXUMtxyHNn77MA8ecAMPG8DL4CIsf+HzMbhgeQ/8QiI/B05Zn23gHXC9HTdwM/VurdegGifBtyTrIlOoxlwSHHaAn8EtkZw3fhv+f0gmYwRJ0KZbKdSYkdAOd4KfwHdkk1BCXxLmQN5oMr8R3wmeHllRm4TEeARsDP7YSl21+boIrXQafAD+ID8J2UroT8IVajaaAuGuk+gWrUg9DgGkJssQkzXgQfA5eI1kYwHCSMGIK5PXvURtEsrzlpKAzZgn+PwWK0ia4FOSKjlqZU0STCkJ/ZiG/3F8vgGvgpsifR/4GNwHZ0Bee3IcunR0b6SUhO3gR/ClL7Sex0gSwI2y2BhjFN7gKZJGdp6kMdeC13ELnMX2eA2SBJPrCW7ucmOcM7LRhyQbZO4Cb4K/wQsUlmkhCcVy5LfNb50rICn7FBwriidDfjEX7cgmwQSVkFtFKQmuHyxTdz0yT5BepoUkqGD7G+Ar8Eigya02pxAxvyy3rq4S4tvBpFFySXBBfoJ7I10Ow5JgmqZ3CfwAHiJpgsMR70AwBfmsp8wnIYD0hVwS3NWIzm+C68lBKcpMEpyVunp3FLgRpkchmiSMEIx2k61U/HRbgOounr9b8vMZ3zhGkwRlee76Ox0rYni+we2gxKSclKQRviZpjutE5Ntm/SwSPa+Fq6DQE7rRPJ7jStgM9TPyj0IyRyeIk0BJJeTR+prmjyuBmyP3iLE3hANfke8tZ9L1h/CPwz6S3wMTOHEVOH61+g5J0EZQnYQM+Phxo3xB/neFZE4FfB2a5u1PTLd+JveHFDamTcKQGajPrE2C/i8VHQVLbpj7Sc50/NulDCWoIgKSxqibVUCphBXH7EU6QydJdRHCShiOQuAuCYGRNxjw26HfwtoMMSwbtUo1CVlXp9A3w+cxrATVjJFVeFBsvN13WsWuRUlXSEKrKfqrSJOgoj5wgGp3dqh2csg55uQaamwFuocu9RFvdcTLHG75H6MiSZFphWcvmlhjAv4rnzK8iH11mhFXI4gjA//7y18tO4SjoJHGSwAAAABJRU5ErkJggg==>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEwAAAAaCAYAAAAdQLrBAAAEVUlEQVR4XsVYTahPQRQ/kxTFkx6px4qUlMVTShIl2Vj4WAiLlwULLJDSS0hJNjYSJeJlI+Vjw5JSkq/ysRCRhZASG4mF4nfuzPxn5szMvXPve/jVz733nDNnZn7/Mx8PUVcoaWhGhyY9jKbt2MAfwX8djdd5y3G0DO8M1dxTY0B3tEzdMvyfYgO4VBrboTe9qeB+cILzxSgXo8tyKI1LoLDpMLhGGoEp4FFkuYLnd/AXeNbwMvjJ2A+C402bAfAiOLmooP8a1Cn88xn8AN4CZ4V+rY0Z3wzwKWkdipATzGI++BF8JhRgkUaUFnKHsXmCOag2yuVihd19Rg0WgkfAieAk8Cp4idyPGjTG6wk8f+O1SbBeq2FVIxh8a0mLMiJcDO4EndEN0sswLZj/4UwzwXHSUQKvOiRstVhxeF48vtskxmSwCnyPbByjBcsk9tFUYcdI/wLbpQM4SdrHy5YHaQRTTYJx7B7wCbxbSFdDO0RJKwPP5adn5ArjPXW9iluwuNdJj8MJ1gRVLxhPnH+dL+Ai4eMN/gHp6ttsbMkKi+CGzhPaDb40T/7uimo8SP1OOhLgERwHN5KrwqRgUmVGnWBziAegsH8RTRe+IXIHQbDpq0CwVJcRuMK2gq/A/tCVaO+b7LuiQdIb/RvwHniT9N67s/KGaZaDF0iPu1awFIaRbE1qXOT2r2uk9xwWZAF4DvwBHqZwOZVVmIDXNe9pj8HTpHO1Ae9HvBx/IaH9AVmYr+QOJQuez1zz3kGwfIWZ/YvukrtSMLeB/QmNY8G8oER8CizaSvA+6YNmduD1IPLZiX/zbH3gHfAtuTzcbMhrGwjWOEbVOyWjULt/8QCWCV8OsWDdwQNaQnydITpDDZdhhNsK4yVpYefAq2S1sS0m/4phBVMlFaY1ylWYXY72BAwkjeSlygbBlBYsEyCRuKOtI316jlBNdSXAeyyLmxKMK4jnOAFj2Efhanlo/Pzkb77HUXKwBjnBzJWB9kpHDXSFqfoKywyFf5RN8PLpJTZ+yjbywBF8w/dPSSsYb/58AQ9gUvL883tYot+UYNPAR9RuOTLyS7LqONG7OyFfgIesMRlpkXfy1YdPSgs+oPAnnDpB8px0OEBaMH4WwRdsBem/DzmBTx7EYLJHz6gKK8zA3sGem6e5gyV7oWDt+iFhOH9tIb06doGvSe9/qYuxrSxJWTwR4grLjTnncMhXWIg+pDpP1RIMNuB8D1mHQc9fvfB8+H9h5vmeMYFKCZZB1HNkoAHVKJhsJL87QlRd9TlGqSUygnXqzVVYp+YWuvGoUlBJ++aIGPr+4QQLcsQJY0uA0iXZlCcZkDBVEMX119ETbAw6rhGsS8aGNpVbxsjvOqRj09YIhWGlGEW69k29FlHjyPAv0dR5xt8zZ/zFaG5fH1HvlchEZ8wd4WfT72H+kt6yMVlHDunRxNcjbW1EQUgSRe1skAxWsSmJoqCWkDnld4Wkkf4A63ixi1lwM3wAAAAASUVORK5CYII=>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADMAAAAaCAYAAAAaAmTUAAADZ0lEQVR4Xs2YTYhPURjG35NoLMiESLIgJSkhRhaUhY0Fi1kpJTtrhY3NlCyspGxEIhZSPrJWs2KimGzIR5qiKbGRUhTPc865956P99y5d7rKr57/vfd9z3u+33Nvf5ESpnAfUXQoGKW0t+QOFa2YZvtnZI1VhswxP2w1A9UV0FLj/FwtDDAjPUIXQmehHalDpbzbFkHnoe2qNyUsgvtRXO5CP6Df0CR0BRqDdwT+U7i/Cf2BXnrfYR8e8gBanBo9B8TFsY4Z6Jp/pqagX2jrRdJ3xtC3yj12GJhnG/QFmoZWWkscuxr6DG2OrA0boX2pUYGDOREafDO7oa/iO25txq70HehcU6wbR8U1dAsySuRe4SwZu4oB9V6ZkPKqeMwScR3e6R7rH7IGeiduNUK4A95D60NjHFpTWy6JMmvEl6CdZTQ4QG6HmrwdYjZIuPIhxq44V56TFrIWeitusrti2JlvYvMkg8vNnBp3j1lX2YHZzGoJ3zOGs3zdGnPczjCyLLGPQI/E75jEV4SzMo3i+ay5meSMlvKFqzbToSWeUNnKg+XQU2g2dRDj4jjZyRYvwy02l5bWpQN8Y29Se4QR5stj6CAemB8Ut9AR6DX0CtpaFU44A30QV74TUb4k1dFOf4kb4joaE1fCfOGRzCO+OpKpC8KTzMiCoGzKIQkPDpXmSMDymShfgn5U+RINJhmsPhhLXZL5wncY60vjFUOFzbkOg2lg8pUSjMn9HZpqxp4V42Am7V3mslRbjPXoJHHJI3cGctqUcjaCR67bYllnzElxqxIcy2Ehe889zXdEjC9m3MHBA6Y9r8qwfsbyxd3KCjT2DNexbBxuS9wTN5i2cx5J7U8ipRJwHHbUYbhde2K3GVeexzOPaRW+aX+icHhafYI2+eXkTLIDoX+/C81Wpiofwo/F+1LF2sFYXS2NuMCocccyvzBqohraq2v3KlQvtjkCW9yay9mY9B+hPbmrD0lEVkFsGDfB91NWtit54ARMD2Evf/flMTGZ3yg2S21lY0zUIVkHPZdOX+Na7zRbd55AW+pK4ktfePhchk5LqQrN6myapze7oNtQ+rHoq9faUG00HoMu4t6+ZPViyXVwsk5r/870oWt01LC/Zp1Jn1Lavf8ZSWd79713wBAM2eiQdXnCjRNh5C9proyMb/+xpwAAAABJRU5ErkJggg==>

[image14]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAABZUlEQVR4XpVTLU8EQQztCJJDEEIOzPEPSBAILOJ+wWkEDgEWjeYHIBeBJSEogkThTvEXEISEoMgFQwJvpvPRbmf24CXddt9r32x378jRMIruRL0EpjEQhmVImmvLaNS4gKYQIZdpYx3yLfICXd+oH9DcEccN6jfkc+QVbk9WytLt4PYV3DPqraKHix+EMZ3m9gD9TDPnmxxdZyUaxJsfXO4Ro6JpXIDzTSdVlTW/ZlzD4hHxgdjXdDDbIF7hUNMaLwjsT7x/RljhCEXnWqdHM3/CHW62kSfgJsi7UK+QvxCreaCO8JKeYJA+XxfrY8Q4dIhuBQhrSJ+Ig9Rlm+V/IlWFmVHtDVuXAumG+hL5TMiVWcskbEKak3/8jOYekWNhirwg/oGkeAe3p5tTkm72HRSYw3vVH2ZL3ZyoTSeoIYmeQc3PzA75WC0yVhhA78ha1USZLc9kDMxO/4A9YKmVPLXeLP1+AU0bKfhK4vePAAAAAElFTkSuQmCC>

[image15]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAbCAYAAACqenW9AAABUElEQVR4Xo2TL05EMRDGp+IlazZZAiQIHCdYtQ7cakIQXGCvQBAbDoDArCErQWDWgUJxBzAbEgRBkaAwCAS/ttOm7bwEJpnOzDff/GlfnjhBwpGNDWzCFVjy/upSAQ3ZTGsKq2kFYRs9wp8BXGZClrrLlPAG7JPE2o6pyOGCuxwvBKuUq2rKnfDnHF8E+xmOKSMD9B71nf0ExG1gtrzTVuyhbxILBuSW2DsoT9hZxaRyyvEN6Qw7wk7AzvF/FKvI80AWOcG/UvACfUfHmSa6r4tdSLpJSpgXFH8hkVf0kQSj3YdiURpy3FfybgfoQln+ssOA6hhIrnzfMdhC86eYQ8WlA1lJ9b7hQr7BJuE1/k4ie2eN3moh4jqOZ/QBPW53HqFdg/kvN6ww8zQJMIkiV5hC+n41E6bOpRjAiu3ct9+/pK+wCpVge1tERcl9ecV+AfdDKJP/Zds+AAAAAElFTkSuQmCC>

[image16]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAaCAYAAAC+aNwHAAABqUlEQVR4Xn2RP0sDQRDFd5GIGGJjBLEQ0crCwkIECz+FhU3SSRDESiwsbfIV0ggSsLMXtBFsRRBLQUQsbLQRC1HQ39ztZv/ePfJuZt+83Z3JKpVAx0JWKrVcwcLUfF/Wnoo60NK6j7qqubrOUiA1VN2fOh3qZswg8KWbTNv+oZEp0NzCuXJZPYpLdZtMKGjBOTSJEaJ5ZSfhkHBJ8io58YI4hE9wz7NnsUj5hDiF6xzvEXHM1HbhG1xx9giYO3zEOAPvVdm+xRb8o94xcwra3gXFAS0+E6Tr5B9ht7qv5YCyE6s981l2a6PyOyW+eNqSWd9RnTYHc5HW7grZVkba19L+lVfr8v2GXWNaJQxIdvweLdYwvFN4MEcuqCJXA1YNVVL+3HniftCBgcz4C8/gEPmReKDKjQLptamKi3g1H2YKNmqZl7n1rHIb7YgWx3ASjo8ULc+ni+eT+ZsjdzqoPPMt3Ka04Rc24SfsWyE3Izkvoa5hLyqoH5a8tf5CvZFacrkTGklrwR1eHkySm8ovBFq0M+kmo9Sgsj+HCjlEboQA0XDJ3JXjKPUPSuwuQ6CP2zMAAAAASUVORK5CYII=>

[image17]: <data:image/png;base64,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>

[image18]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAZCAYAAAB3oa15AAAC/UlEQVR4XrWWz6tNURTH1+71ihAlBnoTwkgp/gBvIAYGeiUxwITJS2KiV8oEKZmJiXilRImBJKVkKFFeJOVHJiYm8saK79prn3P2j7XOPtflU9+771lr7R9r73X2vUQWrjQUpoQeb3A1ET2RnprfowVpNpMiuDMUrgTba3q8Q/NqtgbTFzvSoORJ6a+YVFvM0G0ZQFZC445X9C8MHdoJ2OG2R2OE6FnoY25UOAU9gY5B+4POQM+gzVGcYC7AdPwVW6Bv0KfcoTCHqX9Tqu/QniQqYym0NjfqWaSlVH4vLDz2fXxfJCWBuDpCwwm8xMMtWG4Sn4SjlSHchBd/B3pM2jpMBgXNIuwi2uekJNDRjjUXlKHNVdo2QC+gndAEG7qQ/m8GXDr3oCmSGu5JoMVIQEOffx10DXoPHYQmjbgak9A8tANaQVECxXCpgRd/AToNvYNeQ0dIxvMU/YXCzHV3liSRo/BzLRf4XknX9uEwdC4YkgQ8xXQtnMBn+HehnUDYJpI1XKcoCQV9RFiXozkJfZBWiStNPOkDOFaHZyTg7BJKN4Bvm+lszBPQL5JNEco5tf86wSINnwDf5Qdad0Lbn3fpKknpNPgTcFYJ1XC0l+Q6fZS7KoO5poz4B4hPgU+jxjaS4/Zy0t6GfgZxbS+R0HT28MQLXYDWRK4mAT7FQfDRX4YWXPMiV+ndCr4YePfzEtroZGP8YsMIi2jPUzrnIZIErkS2nHYBfAO9gmZg81dpTu9Sdfga/RLUsAx6SrwwRzc6s3uIj/XtE9Eq8nHuK/l3y56dfwP4l6/9DaijlUBia3Y+/lvAZcDvBAfyLfUD2td0IJn/LXQJOg69IblAuDRNtkN3oa2txU5UqPkLtA7aBnj4XdtN8kdumnw5af3HRru5Ynq8Pa6CUWJT6j21CM2mY55ASnCY/tyjB2pWzTYu/2DMboj6YGZEvGvdR4fZ0WJABwlJAwd0G4t4/P88V+2F7RgaN0pkh7mOxmy4qc8TE6LMYGUBhaGjx+X5Az6MYOk+y1y/AAAAAElFTkSuQmCC>

[image19]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAaCAYAAADWm14/AAACiklEQVR4Xp1UT6hPQRQ+s/gVochCyUJJSVYkC1vZvAUL/zZPtlY2Fk+xUbKzsZQSGwurFxaUlA1lp5R4JSulZ/H0ilLP952ZO//umd+911ffnbnnO+fMmTNzrwjh4mMERvqNdMvQReSR07O00chlLWe7VlbbycYUX2LUiTT1lpDs1qwBddgMLoO/wZOlFLEFvAHTE4zrYbyX8T34B3ycQnpoVnNB/OIb8DhViwkafxB8B+4orCIz8AG4QVOx0kC7d4EvoH8QH3yZxjkxC+D99Bqc/HBGfI5tUbaTRCMnt8AlzK6LD16qkta4DS7akmrI4dgNK76yODmE5zKsO0UX1gLueskE78FLqDyGEk724/EVs++11AKrfISg0/rmePaOBTyMHv0q9oHfIMTzB3jeJzCugG/BA2pMcpzV4G1HATJTFy1AL+HTwqvEAvS/cF5xfkHQrYkWJZfEb0rRLCC8suXPwCOZdAzqT4yvoleoLEM4417a4+Jb/wbcU6rdvIy4Cj4Hz0M4h5HkHfgFfsodI1x3/vKDL8YSWhzmdzIpQ4pgmy4mIWI3+AVcrasNwOfn0H7/CVYeMxj4Y2J3bkarmcafPf98AbHdvFj8wfAYLHTtX6wFZDiLYR2zjxj3Blt6xCVEDktosVEcC+AZ6hkrktN2zF+LdkeORquTrXheA9fE/8j6nyfheMGc7ozJyexPJpuEN9/pD6TTV51fCBeziKvJI/kMXpGiq02kLaUWWWgKUWl7eDR0O7zhXApNpxyDG6wccvQMIzAUY+93Pvq+wVJsqe81F1Y7hlIM6YpJTv9TRYDlZqVrYqwf4X3ziDCfkmQq0m7Kf3yH5m4tW0AhTUlgmDLMV3sI7v8AyC9jHEIXj/8AAAAASUVORK5CYII=>

[image20]: <data:image/png;base64,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>

[image21]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAAAZCAYAAADXPsWXAAABk0lEQVR4Xo1Tu0oFMRDNFLdSQb9BbG5nIRZ2trdVO8HP0C+wthbBzsY/EESwEuwEO0EsRLC7YCEI1zOTmWQymxUPnOy8Mjmz2U2JUgEVWw2X64HTlItqpTXRxAjyVrNc0EOLoiqXahB9DR1EkhL2Lrjm6lvICJSWYF6DX0IS+7yQ0iOqvmGvuq090BTLO/gAW08tmiewLsEzH1TYO5BlBv6AF02qOntYbuGs1HDdrIF0inUBHtagQ85fgRP1bc2Xqq1uUh5nygdYe66AvQHrFe62hnWnV5HBo8zBFyMq5ih+g32UVIEdO9itkFGKyiKRdrB8gPelskBb6YOv+BPctHRplGHvK6JODawnvlriDyoKFUnHWBY2RKwwzJDJVxtA/C7yx7eoP2pORLDcztWKin08+Et+Fq+ZsoI/5Ttwy7IqehnLCZ58Y08gf9GhwYg0MXtHBYw3+zfippEZdaRBZOA14V4nj5HDEoebawuw1ECVmGFj8yeo2VdpcqxI/Fraa97Cqe7L7xz/h1qX6pnlqJjo+r+7RS69jW15YAAAAABJRU5ErkJggg==>

[image22]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAcCAYAAAC+lOV/AAABlUlEQVR4Xo2ULU8DQRCGd0OagCiOkOAxBIsBh6hBYEgDPwEsCalH1OD4BwRIQKCqG5BINA0SB0kFCa48c7t7Nzt37fGmc+98z+xeW+e8dyWUmhmiRjNQlvh/lH1UwyrSaPiqwPiLzX2xvl1KAkpXyK3So0rDfXR4PsLX9QK7Rh09/D/wjRhhP72OfEydShhjzeARruUYzBvkG4eGEa+o38gY6ZZejWxwNKB1aB/5QH+D12pJsrPZOuGCS9uAJ2RMYNEtTGk4wyaPJ2QVeWHAJ7xl78Ygnt67K/gItUsBl+a+kJ3aoAaQ5G6RFURueETJL9KrJsch1dmLZwe5xxjCfVx9+BmZUXhocjN08T3A22JUQ/wAQ971IPhjJN/CndH9Mlmq+SkixeYrGqwl5IDCd3gviwccO1nb+TuXzhkPvwtNQ7DoPiN2ogqnpb+KnxcRs3bqay4kGPnKGqmo0LUxDyYhvcM0WbhtZgNUsq5r+W7muQ1zW8rnQZ/JNMn/vpt/ovWt5bec3VRSmhu0Y2HVwuA81K/tD/O4LJLUv+1LAAAAAElFTkSuQmCC>

[image23]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFEAAAAaCAYAAADPELCZAAAEkklEQVR4XtVYTchWRRQ+lwgME9KIIkRMKSLaFGSRUJsIIkgXYSG5rlxUK2uRZaEY0kKjArEoQl1EixApyQjEiFoE5aIUIiQSRKiFFLQQ6nnuzNw798yZuXPf9/OTHr7ne997fueeOXdm7iuSoNGCatR6Oru8dV4zBwpBC6oUTWyd8extMgZFlH3K2hoUym8K69G7zxnoimLBxz57wNk9J6BNsiiZZsCkcU0y9jB9miWQb8OXr8F/wa/AbZAtweft4H7Y/OZ1f4KPekfqt4O/e91pcKfXTYM5rgIse0smci24D/wL/BZ8AlwJvgZ+Br4C/uxlkguSE1u4B/wDXK4VwEviCsVPjS1IcgCfV2tFFcYGWNKXdCK3gj+A58CHZWjN77vE3dNRcQ1RBytnkDV9EW+O1AG7xSX8iBdRnOvAD8FbelEKK+9s0HXIYjXUP8HiPL7fq5Ue4X53l0NNA1v6V2ERh0E5o2clKmKEZ0lzDGP3a8mIXv4U+FCvmITj4D/gk1oRgc3CR5ldOhG5wbugv8DgrkjGR/RdadfFrvUDVoGHwOsjWYs+RT5ZBXhze2W2IJfAz8FrtCIC7/ckuFYr2pTuz8ieCAKoaLgWfieuzQMeBN8CH5d+0yHosMPLU3R5sgkNJLbLxE0Sn4Rx9O43iSvi5k4SIcrCAt8dapWmnwh/wOagWaQHvJhJ3gfvlH79OOF1lL0jlZvJcEbHxjzQsBs/Ee6yeYcO3oQ+PE0YHSalxCVVB9umly4Vt5Zs8Nfssh3iLEIR8bi3hUN3NnHH9kiyUJAIO+Q1Lah+DjwMrlA6A20uniB4H0ut2M1YRo+hVbiq8+XGweJxnfsAvNHLOauY3YZF5EzvabIRM2JX/OdBHoem8D3wR3Fn1O3NePfzHtQGmIyJMdY35TUz9arEy+KOLFyL+HgHcJ0507hu5MF8ZkwcGI9QH4PrtaKAjcjCJaBU7D3S2gW0o2KuzseP8ypx52Z3WTl4Pgp/S7rth/WSm0uyGw9hZxpKUxtDz39v4qN0TLHACT8r5Q3pbekLxjxPg2+Ax8QV8wvwfnFvZ+fAO4Jhi2T4QwHPfdxM9CyGIvLs1YGuSbyFwxrwoHRPxKRmYCN8Ca5Q9uysF8QVKoB5nhHXODzysPO+F3duph27ui1iLbipcOeNmqG74iN+JAgWAVuET0Zl1RQeAy+AF8FPxa2tXCdPiduoYrBh+NrH08brPl94FeTVi2K/CmexUvLb133gai28LHAjYAcm77S5wRFKx+KsAzd5roOBesK67r4B//kDRTjecW8guDTool8hlO58gNhQO/Hakk2E7cK3l2/A28RNXDjmPSJuIhTsIAaqDXt4l8Ev6BolnQGrdD20Rl87DKSmScMO5estfzZ7VdyytVXckUzvDx3MUBlpBpOMTSQRIkGimxWDWRiNyrUvLCN+HTR8yvGU0LT5H2BQOBsjahMFn4JKY4JpDvr+siG14QKhD6mD62sDFSbjyAXRcn1tocZmUTHPgCLfecLM53z5UB5WWZvDbF6TodPo62mgdxwh970OwcN/5gLk5Ab+AyaJhqLlPykSAAAAAElFTkSuQmCC>

[image24]: <data:image/png;base64,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>

[image25]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAABsElEQVR4Xq1TvyvFURQ/JxkkhShvUiYZLYoyKruF8geY/RUGkwwyWmUkTBaRSSwSm0kppAzq+Zzv/XXuvef1vPKpzzv3fs6Pe8793kf0F3CH9X+jru2V2mGgCWIjJ8vuXirUqbRsk5QRcAv8An/AC3AfnIsRRLPgPfgBnoNrTi7Kqu0r+ABOeFf4EYyCx+BAEByCv56wDR6C/boOzAzMCalO6zGLNUsxpo2ouaZXwSOwZZ1ua7g3yJ/wLfq9jLPt6UdLx6YSRTG/lVFuwXEoLXaXfAYOpkiyRzKUFZb7YlrA+orkqzG9w87HUIn14R0789gBH8EDBIzB7pL7IGLtjAbhgPQj7+wa3MS2z6vSkXT2DE41eTHcWIdiMOvkuvA3Gy8YD5PlEV+Cw05yfnvtNjJi25gFj5fvYL/B5WKkhLRt7ucGfItS8kr2HrmuT8Gh4Mpqwi5RcyJLRxIsfIFj2kdNwjyJ3vg5xhQI3fYC1UUFNWa+0mP0jvTX0AX0ER0LZw7dSoFuqu03ZbtHjVotlDpAUIzpp0lDBa92WKgcWaKNOkSfbEE7OE/UJlOtiob2Cw+NNnKoZofoAAAAAElFTkSuQmCC>

[image26]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACsAAAAZCAYAAACo79dmAAADQUlEQVR4Xq1Wz6tOURTdJ72iKI9Er1eEUjJBIgNmJAMvPQbCyMQ/IMmEkjKTDNWXMqA3ISUp+ZUyUTIQCVF69fLKQBko1jp73/udX/e79+atWt+5Z5+919l3nx/3E+kLlxoWCr2EK+deQQuKHjOXXEu2jugd2itghPOIoQzOe59OzTEywSOiMdlAG6bAb+ApcCP4DHwK3gZnwb+i4iXsA1+Bq7Ubzb0IPA7TXbTLwgEDYxhLjU6g+gdwG57WoX0LnhOdiFgO+yO0r8GVVRkN6MtL8KTv+QG3GD9nzD4P0x+0j6WcLMFY+lJrNJxWbKeo2EPwiTDB4TixG5wX72cWbY6heYN2jRo9xmDbi3YTnNbj+aNUyWYL7g2T4HtRrZHYLrrM9OMb/gIPhA5aLBl3uhUOBUNj4Aw4qNwKmJAwWUPizO4AnHFesyzFye6An0QryX16xewpOFGa7AbwK3gisKUIknWFbVAnxoPGPCabkuXS/hT/VgUHM1nDiX6AO6ph8YfC0bZHu64k05JsDWi4WWdauYzIWdFqtVw5HqtE9ybbCqzoHLg1sKXQZF3TnrXEnC8CX3w6HlXQ55bkS+uRaarY9WQIL+tYtYk0YNh1zXs2XrnKjwXMwLekQDFZjziBi6LbJgSFNdlmFJINhevnCXtxFiB9d49rosk+YKfkIHrYBiDv2RpWGSZrh6IRhWQNJmLzbga/y4gtySvqt7GEJeAN0S9MlJBNwBVJD12KYM+OPGDUmIPuwdqSVI/J3HNa3QtSX+z+CzQN53eiVV1q/jVMhweLd/Rwghxrwc/gc0SNp4O1kuOLO1aWFW7ECtG7lglX5OfxBQR2QUDVynsEN4PjDXFeu5WTb2+K6VkxKmYHyKIui35y6y9nE+DvDuPnKJ73SxLgxaI8omfue+55rlKMumgNGA5we3BP8xB3QaNkEYE399oXyW+KMsrTMBb/DdwW7ZZug9zSjrxafLwqehALn+nSxBH4p4exlySQbYmJ0cfZ6V87Xm31f1If301kCm734du6V3OEE7TNmA/xFpEO1azAvWoxRIcodYkd2/Lsjo4iiVvHqP9EtjIdYb55SG6RBqOES1r2KGVX9szQ0e0f+EaALaglFMoAAAAASUVORK5CYII=>

[image27]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAaCAYAAABhJqYYAAABU0lEQVR4Xn2RMUsEQQyFM4hwjXAHgtdbW/sPrrHwfoNgYWMp11hbaWlnI1yl5Z2lpf1hKVjYKBY2Ilgc6JfM7kx2d9hAkpfkbebtjIhasFg0G+XQGhSLynyvf0toErqbq05pkHuGjvEH0JpyAR6kcaLUKC7YJ3zhF2kUzR+ZPjsB/ZInnpItNzbxe8o3eruZYJZYkMKYcoe8orsAD7K0SN4gnOIv4FsGS/C3qN7G8cG2XYLecf0ptSfxet0XU/yHcuYGc1G9UuuN5CGZLeEDvBcHNluJ6k33GzUfgv5AN4kYZ2vigcRbGdbtCQPVNrODYtCIhKASpvTOjEl3THqW+pXiqx/hj/iI4lq8PLHjwiv5DiqkcA7+xPX6ruJtNU0b+hhbVlkO24aqhsv+5vPAd4sUXzT2ZELrNG+dk9vWT6j0lbR0cLvsUWXW0F8il79skSv8D7guKHz45/PFAAAAAElFTkSuQmCC>

[image28]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAcCAYAAAC+lOV/AAABrUlEQVR4XpVUu0pEMRBNWBYWZEVBWVisBBtb0cLCwsIvuJVgLdYWK/oXCmIjyoofIFgpLNgI+gFWliI2VmKtZzKTZPK4oGc5yeTM3JlJ7t0Yk8Aq0xr6ac1bPKtYtrXgoRJ4E4nTUJU2z0mxVUTdt5l6SiXppQUVbymVioKuYcv2fau5Xii2UERN5hQ2lIt+lurx/4Pk6IMDLDo6adyne7lzMHp5zQa8A5/BMzi7os8g0bnYm7C/MV8a1fMieC2BJ1BfwaH4VsF9Nu0Khg9wYrhLh11wG5wFnxB0i7nHLruDYUtt4wAcO48IU4bb3AC/wD33+thLLS+o4AaGdCLAUVCCe/ABnHah1izD8a7CaFsX4Lw+UMIAfIE4Vjrt91Ot12GPsgfdivZIe51g2ZfXcojhx3mt7UI/hrWkDlrDrmF4g49avwFPEXaE+Qp8BBv9r2PLbS8IHdTEFtzH4L+PoZXTr9dssTVUgQy8sbhUEfzHKB8Jz/Cc3iMBuRgK1ZLmt2bw+ypxqdZZluLa+ANi81klUtorR60QNZLTDCNVEocvWgbWUB5SW2y804z5BWAMIljCrwfBAAAAAElFTkSuQmCC>

[image29]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEcAAAAaCAYAAADloEE2AAAD8UlEQVR4XtVZT6hPQRQ+NxHx/CkiWShsWD+KsFNKsaBEdhZYiBQWFjaS1VvIkl5PEkkWSkhRUtRTIqUnC2UjfxbPwu75vntmfnfu3Jk78/tdv+Srr/vmnDPnzD1zzsx974mEUPiCf4lhLaZoePbHirB0IOS4Km1yDDsiHCIgDYiacIxq9hykHKT0Pvq1txh03v+DYbxhm0/V9RqpZ+rOaZsvsgO8A34AV1hh+xQXdgFh5C9Dkgb1SOXzAvgOnMHwlFE0kfCbwirRBM3WYZ/essxzjHJsFI7lWXAa3FaJ+kUobiVj9TCILw8NG0jph4FCg87FT/fBKdENjqPDIpmYDplvQYdFZYAJmSpqVR/C4ItA9gXZL8+bJfCzsnxmIhQ2JIvBVMCAKFjxv0GeN0wO34FsSZQiN2yZffAWeA+8Dn4Dz0hs7a4waNA/km7CBqz4X+AY1C/wvAY+B9+Dq2OTGmgxs9nf4sgmxLu98tESqTMau8KKnwGvgvOMYhSa76LVpOiwJGafybGgqxvgR/zIFjOiMgLbbZGKNGI9bp+ryDJvJMQFK/4puNiRbQJ/SPlexr4+bS14WbQANtQ0Hux5wyAWy8A3Rk49wR5mhX0CR43sL6DwF55G3Z6bWt2yiqNGzvX69ha7RNuw9WzlDcVvBDfARdGyZBKQlMLdlUkj7x/hRXYBN2wKflc5vteAn8Fx0Yju2jleigcTwo0/5OiCYF9OY5q9xnnGvAUfiPbwAfC00RH15IReWGUbwSPggpquAqvzhGiJN6E+9uFxUNybpx6Pa/Wv8ONSVk2xUzQxN418PXgXPAzeFk0gzyYPlYRO6dz9gOKLs2rOSeV8ndERk0WycgosuuBhzoMy+ElfaM9T/xic76ktWNFVezTBDfVbagLO2fp8n/3geXC56A223djsBl9KoqXs2cIE2OyPgA8R4BWej8C9Rm4RbStnF1hx/Bz4AikrKAT6/QleERO7uYvy2jD25cuzZbMn2wN+Fa0Sfppwg1lNbjKY0HHxQ5ajuogT7KFrMUs02yOBBUeT00Rgdgf0vNUrPxSEG7y80PcgeCuxUgl7AfG8mSPh+XFErVURT050og81DGxUEyl9DPV5/Aay7ccjgt2yFTwJO78wPOQtgE54MPMMeAZeEv1V438AW5vVcky0jZ9g2WMSP8s6IpiUoLCHdq1EDZpiSnypP26ALWivdbbbQkeXMd2B/ctZNSc229jF1D2EXiiOfMsBMFTnUSSiJtTtCE0OyerwtziNbNs2Q0fnmbXNItr0MV31z5SYhbSqkjBzAy76y2+eXdoqbeGgzw2oULcsR62TfWXRFA0D6YUl1d2Qcu7o/wD3TnYxattwEAAAAABJRU5ErkJggg==>

[image30]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAaCAYAAADIUm6MAAAC5klEQVR4Xs1Wz6tPQRQ/00s99YgiL7vnZUPZocjWxoKNUvIHkOzorS2V5Ec2KD0L5IktomwUGykbhWzYvVd2rPicmbkzZ2bO+d77fd+nfOoz37nnzDnzueeee+dLjjK6ebZJ738GL23V+sYLbIpUhY+XjdFkzL+aaziUCMXUC1NEuDgDfomsXKuHrOzwXG4PhvcIYC1XSlca0sUChqPSLOa7wZeY7y2s/x68343amBF0LLgoPOII+BT8Dv4Gl7PwCsp9tCan2HphCC8zlcId7cK4H9wMLoLLZAmPUJ6UgdHeBBeFa4mFTW2ViEHCW5SZlLx9EBWP0ZrwruLeVu4yWripKLUHP7Vt4JT0lnDTGLbwRMQZrVIiVbyBC8KdItzUHMDusxif4/cd+BhcL3xXMczidxP4BvwJHoh+RlFxa69S+DgV95CJ04zX3wbXgdfBb+Bc9G0FP4DTWM7+W+AfKotXVFzpBG/pEe7UiluI4ZfBwxRa5S34CtwQ/fzir4ht5jH/SMHeYW1ahThRe8dmKYCNFPqaxf8Czwnf6WjrwDf3kHzrFE+srLhyYQsf1Co6XK72a+IbCRt2thd5pb+RU+KaYQsXlvoAkjCE+8BD4AVwpvQlbAc/Yy3nqGy0GB8Wv7B3wB1iDcNuFVlxQzg/6gfgCniw8s0i5hOFl+pi5evAPc29nfobOEGhTZbE9XlKciZrFZ6zII0sgsGVukfhL8Hd9lEm7MNOXym0yyMKgk+CPyj09U34Z2L1JYJwaVM2qY/8AYifQEfzGC9Ju4IpFw4hfxDFOP4MxkNHRStcgdUqZVo9yTEKfZ7QLcvL00220GyM7r9KA1fE1K0yFHzq3Qd3+itLxAA0oabwDiFiPOF5F34pj2dHiUZMhR6/IbyI8ifnMwpHr42enYai3FpeeMyB18AnFD6TFdqACaAn061rgLETjx0wAmYu05GRlwxY3INBGfwifaVp1R2ToS9nn99CEack+Qs69HB2vVY9KgAAAABJRU5ErkJggg==>

[image31]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAaCAYAAACD+r1hAAABXklEQVR4XnVRu0pEQQydcFkQZC9aiCJ+gLX7AX6Cgh9iIVhZWYlfYKcgW1jZLFgIu7WNhYV21oIfoSfJZCbz2EAmJ2dOHvdOCERBjaPHa60U0bqiuofJ7aI3N5swLW2WpxqR8jTHpZlzqN+9Zus5DapXaRU+qds3lGZT+D7wBuIEvqdcnmlxwHkJX8IfQXxhnRd82xyST3AzEaueTzrFcY04KE1z+LFwFP4Qz/1CvMYD/CCWbyK8wkdkt8g/gA+1rxbwTx1zikKi79TPhGmjSLrHuwL8dbcj4JArdZV3+DPybcQFPvhNbihs4byH72itcHSCwB92Bz8C8xP0b/G74c/Rha6TR2ICd6Qn4BVWO8MdT1hCchPkPfI6YqjmR9oF4MgMx6lJRO70RhVMa77couza7RjZHk6Ekqm40QQv6UWDVXWCERRlxRSbm4RuXiGM5q4jysXdAjV3w3pXY+gfoy4c25SgTC0AAAAASUVORK5CYII=>

[image32]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAaCAYAAADIUm6MAAADrklEQVR4Xr1WS4iOURh+T1KDRiYjTBbTaCwmkYRs2E3JxmJCihVhdlLMgpKSlVKyd2koLIzkttCwmQglcokkilmYlZSF4nnO5f/O9f+/f6Y8f893zvfezjnvec/5fpEZQeGnm+Yo6UvyGDOzy0lzMh+t9GW04dmGaRah/0yjTQulQUtyB08/GzweK1r5AxvBE2L8a2MQvAH+ApdEuggqOwsrGgbHwDmeLEFJLsaP/sPNjDzog7YMnQ9SWHGNOP0weo12c6yoAx3fDEJ/xumPtEUMQv87FraBk+BdDKKz3WqwGN7EO8GHYuKF8Ix8jIA/q9fUICey6AKfiI4RGfmDhU2ASMa5IJ7qChQZxw7wNvhezCR6bNsaZmKb8JhEn20OtOrGk+fHlSLHZHZz4JmbBDeY18yMLVx9j8PkJtrL4A/wqDTzIoz2IPgFXF6JGlgKjkF2He0d8AW4A5wA34BrEw/GUTre7kCamJkVsr65SodLYnZA3zIZHx+npWEbWLLeL0ojc7IQfA5+BlfA8i/aw1ZnoS8K7vhH8FirgVlTnPhO/Wa+5qPKODOIBzVLW4TgInmgvK3XJkzIWfciZkeYyVExJfMWXJWGcwdUMa64Cbm+g6tvlgpLhlgEvtRypfU+tku6C5mJa31H5O92lqWVogrYiT7j2YnngQOleJuMeI7c+im8rhOTmQVaqrx+CA7wCJwfKzzYBCkmhIkhaM8djOESdy5W+KtjjXHi7kZgNl/BAHeyrtFd4BGwFzwlZndisNRsWQXbvl9MhvdJdeBYgs6IB9YtwkKretAwXlT/FZhBfur9MmGWp4QHw2T3qpiv2AFwQEz5xNgq5mCv8WRzYXZPzN+IbejvQfunqludaf5F0NAhbVy709/RY2ll4baEk3P3K+v0PvgUfAAOUYhg89CsBp9ZOx8D0H8Ta+vhkJj4zCwnvBeRvoq5brmjjTKJcsFr8BPYF4pD8EMTH0AGXCzpB4IlcV70IoOh3AGHTsX7wfjdXnnQljdVR2xoQfEFCZMZL8whL46kLJtxcIvoTPhafV0N4cG7vC8fzaHSFuzo/070DVSw8JGaJBNj9vlVPRModU8/eJBvoc9diZBGbyBV0f+apLvqj1UD1s425joM1+SDH5gJiFYG0gIyU+Dn/zHa3lgxTeRWnoGRrwev5BQtwP80OMSK/jVQK6YPVd6yQJTR10KTJJXGrY3ENxHUwn/wapIFH8WM237Y1EBdS1U2zclzstoIxsr/+yvhH7I6fePQ1wCzAAAAAElFTkSuQmCC>

[image33]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAcAAAAdCAYAAABmH3YuAAABHElEQVR4Xm2SP0pDQRDGd9BXCSEJnkBbsUuTA9gJ1oFcQnOCaG3nGQRr0domx4hgryewyG9mdncmIQvfzvfNf97bUqT4qVaUGNdLVLSM7DLmsIqU0ZVnu6c53bbqKrpMo1rgGrLB3h72UPsA/mEL37rOMYgMkKn4qu2kXX1giKon5J+L1vdCVaXcYz5R36hV9BG5gr/ARmS9Y98InbZFqCo34AK5Beu8zRkYiq1f/pg3j+186IB+RWzQ471tOZeQH/gafoJr5DGx+JL7F8xwKZ5StTxzfwFalkfcs7zUHRlbkj/gK13DKjWjfuQJl8I8FfbBeotwp8bxsCzSafz0aiMQtLLcrj9BN6FS0t45GNN5a2T+Y0mmjzlahfId0GgWV6IUHegAAAAASUVORK5CYII=>

[image34]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAbCAYAAAAH+20UAAADs0lEQVR4XrVWTYhOURh+T5O/RMloJE0asZBZUFJmYTclCxaTspiaLNSwtKBYMDUpG8lPCpOUSBYMKSk1JZGfsCJM0wgbLNhMUTzPee+955x7zr13fszT93zn3PfvvPec95xzRQqYsNVmHfgW/Ax2lSxqYKqNgvCTRGBc7clkn4E7wS7wjbY1yaTg29q+EzSHqRgrIWuBbD8UWzzZGvAIOK+QJBynjdLLVAaPxbHk/6Am7mSTdagxmFIci43g0bIwQhhrLnhc1LceiRwegz/Bv+A38AGMLsByCLYv8PwV/ADZCt8JaAOfgt32KQocCVLohhliGMZyaHBdKExSZMLkg0vgw+4IuNiJrGwQvAHO8eQZTNOYOejLGIxl8l8aTrEaHMfjKNqVhdSiMLoGzvcUHeA7cJsny+CPWDm6r+Kp9BHsqLEOsB38A96VMCl/uLOBzEgv/t9L4gWdT/PwmQViGMbqrXEJlozFz/rlEZaDS3UR3JA97/USgM7cREvackiMwxdnzS/JnmnSir8WZ1KAtpysq5IMFSOqX2A9XO+IG1Ch4ZaBr8W+aBSfgj7RjTwEjkJwGNJzUN1Gex6t1nzoyknjBg7HKxAaj4O/wOsgTge5JfbUMJelbKmwNQ8eCKTW0vClz4jbiHsgx+qZQag7Ret+eaZT6AiHJNtDqQHLYP3yaNmNdhe4DxwD+5PpimwCv4M7SnIu7RXRxBTGrsIP9DaLlhdn0p0qWXyjsRhzkyerhKtftWJALicTC6F6TdiECRvV8ugzOtlFbbJ8WEbV0FiasH2sBpc3cZzVAkENg/foYx4+HMbonphAr98T88x3cC60+QIBP8AcEpnzDMQsmOA4q4QG4O7/IFp3Pnhb8WvvJcyWii5/Xg6SOfvJ+2Csor4TeVpQfgI8VlaUUQqQ3YzmUii2l8hv8D64CnwiWjp5aa0F2/xYXp+1H90DCsN6Mqwr1q7PeAdbpJbcnDa8rk1wXbOsmCTP5xHRi+Ae2keiCQ27CEGsJUaPtAFP5rrRfFmkZLVgfX4CO0ue3LB86XymqG7NmPjAsAKuwBjof4tPERXr5mERFA8lmJVpwtgYw+CCsiqJdD7NMDrLr9Brb1xAH1ZfGLWDz8GtntL16mLV6QqERngyA/g7GWk8VCq0fHBly0FJmcWStKwevoftc9BT6PfkqihmSZDNHJs+sb6p7+lGhPsh7kdpzBw1IZ0qMEp7RMnmgrT5LKI08MzyCL2aVqFaQ9RrZxeTGjtxHFukpf8Ao6aAWIFlX5gAAAAASUVORK5CYII=>

[image35]: <data:image/png;base64,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>

[image36]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAaCAYAAAAjZdWPAAACa0lEQVR4Xt2WMYsUQRCFuxHhDESEA0EUjMwMPBBBEME/YKJwGBiY+QfkDgRDYwMjQcRMxMTETFBMDtHQRMFUkAsMBIUDfTU1M91d86q798TED97O9KvXPbW9s7MbghBHdcKjsfTHwezZ8TSIxEuHkmjDDmUrPTMUTdbzNrNMLx0fki0tM2L5zCPlMLhSmIo8RLDB6tgWFe5mjL0tzOpYUZfUiHUSulJaJJXR8d6UWm0mruHlEXQaOgI9ga5n9flsA3oKfYH3I9imKxerlLqQ+WaNw9Bz6Mw4JhEdnoAuQ+vQdpCmaYwNemhPyDqTr8PjoDo4BxpsBbvTK+E1SHxijcjt8Au6YQse2rS/IMEJO3YHRzF5B9O/4vy8LabPJV2gutP1PkzVHU5ndLWL0FvoA7QHvSrLhEh32vzaOWjGJsfx/OC29Rkp3IQ+Bt3ddTjvcPxZRjjFTnsx5jOPwoOXoG/QZla+B/1OQ49Yvz0y5Hl6G3rYKcmu8X7DIegltBOG+1lB9mrwmjYLbcHoabqPuFh/SQwX8PodumUqd6BPctJao7rTrcn75GzQW0N2dkJ3P4b7mUeRnu5CmwuXIgW32E8cGnwBPRhGyjWcyRPk1BSznIN2g94/uT5Dx1NsWq+30d7cgPwqv4FeQ88w9X3Qvxd10iVWuViZ7R/lFBX5Ih6DDuRmA13AXmB4zA6mrfjUknPNCXkbaOLO7P0wLsVXJC6xElmx9U4tU8zbgW7+Yqs0685YtpiTuzyRaG2OYxcNkgyxGizfkl0jJWyln+ZML2D9cVwe/g2xc333w/h/YTfLChswR/nsaUPl+Ad1HDm9jmeDzwAAAABJRU5ErkJggg==>

[image37]: <data:image/png;base64,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>

[image38]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABMAAAAaCAYAAABVX2cEAAABoklEQVR4Xp1SIUsGQRDdCYIiiGIxmLQJBsFksQliNX1w0eovMFn8DAYRkz/AIIgmm0UQNGo3WzUZhM83s7t3u7Ozx+GDudl5b3ZudnecY5B8o2t9DotNObXbSq9Ckqm2pxOKhIKwQHajBQqh70hdsAA7hX3BJhCuIU2pYgfgX+C/4e/gR7q2xivsM9i6p7L7mYNtd2ENfscYdolggvA4CiJ5fdX5U9SQJe/AthDwcT9gK+oMe7Uj5Xkkf1yGn4F/cHJ37jBPo5PgW6Z2YRugp/2SRlj/YvEMmw/6LPiboBslcqZJOljC5x32A9v1lNzXfZvSQpUN4Zmi+QFkTByPCd+Xo3O9VyBcEMi/0K3K49GQMSG/xn1Rk6cwKC0mnwbuKE0REM+UvCwG1T25ZCzKBj1DcFdY81hopC97kZbIinUnpE34N7OYT4ovu58KujPejNci/mu0xSLLOX7ZR/BrWvCId9aFNgohbiyEiLLlOmKm2tGFahXCYh3Rw5VIhSKp0pkg/N6SbKhi1sZBLfc1JQidZeEgDO0swOL+DbuYYsPJ/gDnKS+V84CfEwAAAABJRU5ErkJggg==>

[image39]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFkAAAAaCAYAAADcx/BtAAAEdElEQVR4Xs2YT6hXRRTHzyWEIkIjQxOVRxiI2KIgFYN0o+IiXCQEb5HrJyK4suUrWpkL0aUWGkWgIoFtbJE82liikBuRUNwobnTVwkWQ53tn5t6Zc8+cmd+/Xh84v/ubM2fOzHx/c+fO/RGNQCMdGZI4o5FRNQLTyZIS5ZxFeknfh+xNlmuob6NH6t4aci3hz9VNjJq4c8paWc6hxDWN4h16/mvMEZiVOWSjuCzrivQNcqsg5wc5fyVvsP3Cdt/bTU64OQ2hYieieg3bl2wvp26Vr6jvG3YorZ4ZhRlNEe5pHV++SzxjELVawfYN287eVUlDB/jzc/d1iPANQ4aeHPWR1dgphcjAbgC6iGHoFrZLbK/JihKcqhM5j+9w2O9smbA/ReQ8FX0ddVYROUQVWXsCTZdZ5E9zGiKPvGpeYfuB7V1XjBoaSz9CFVkiU+GWWRt8GbCHvSSdMeawOqwoq84SOQFxmAvGmwP78AWyYzxuTMnIoj3Zpm/1MdsSl6+Re9oGDrM9YXuP3GB+5EbzodKUo4gy8DKdyMN2rWcD20W2b9kus91gWx8FxSyydXMRrGQ7QW7u/7L9zbYniSitZDHAjeRuGxyPFtg+9H4caX5m+5PtTXLNjjfZxF3Wq5Qec+43oizsKjd93bctoazkrt9t/O0RudNCqMC8IIYE/V1he1tW4FxPLk/QxPu7bwFbZAGEXeAkWKn49cMvj+sDzg6fu6WcGAd9fY7V5MQoWBO+1woMFJFbIAZW7V1yiwbMsV1n2+rLMfvZTjlFB+rNkcvVC6xjixzS+uur5ETEceZxVL2X7TmXFqJhIA5bR8pgnN6l+LOI2EzTnMi47f/hVr/x9VO2n9jusO1LonpY4FZoDbyY3GY7G9nuOMDDIjd5kRXCKn6QlBu6R+nDcG9u9hFfUDrA1JqBD/G159RWZGUIEP4Z23ZZAZT4RenwYBy/kuunR0lApZWsEJLD+nLTloMADd9cX/vvFsPtopFbRWKIV6eR3nHt52Al+5gzfH3K1w/iOnIPwk3ChwW0U/gCSHee8g/LmJFFbpPzx1++vIPcoH+nfs+E77T/PltiyVP5ByJ7IBpW8nzkw6rGnvx+5APYFq07ZxfbZ1EZR9Z3SI5kDJHBHOEPF2pwO2IVf0LuQbJEbmJ4/XwrBMsex6JNUpfJR+VERvURcs+US1y4xddzFI03Am95Fsj1kNwpCUfBP9iO0fA8bYtsTAtV8SEevyLOzWuawkuIlXSKrPOLIAeOnfghpCABvOV9L50KYd7WC40tchllGoorTxQ8UjtgNsD+rq3kWrBnY3WamCPomVTk5SM/wbYmt13Uskj5t7yO/BgSFJH7lpU5/pdkRPZTUm8gfGtLq6j9W6Dq5FCDInKErXKuVvNrvvExs7nKjMgOsz3RR2wnm2JYNbbIs2Aa/6OmGUJp8ryTIfvXR6lj184epX/FtUyEJTPuiMZtpzUs3nt27fIwmXwD2kQ+W1GPEmpr1VkFWo7fekxyIqjOMu5f0TIvAJpFjUx7qxySAAAAAElFTkSuQmCC>

[image40]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAHgAAAAaCAYAAAB8WJiDAAAF4ElEQVR4XuWZXchmUxTH105vcUEzIZpcvCEX5GIupF4Zd1NyYS5MaXykKRduzJ0k6k3kxmgmcaOZXiLKZ/JRhEhKPmpSSj7SlIgoSVGK9T9777P3WXuvffY+53meecuvVs/zrP219v7vr3MeIg0jHQVa8hYYq0ZNVxPaGFQzo06tqOafxFhlY+nbihUFu6Jm/u9ow+z9Wvo2owvTzI7WVVNmLH00Q66VTJmMaw5ns73F9m1knwxyLAaEfQfbdTJhIvezne5/VIzJfuraNy7roMQDNOw/bGHczvYG2z9sr1EUdILaizhmNZPGLran2M4UfsT1Kdm4kJ4QNzfS9F62j9nOi51R9svY3mG7IriKrLFtxA7XPsbuONslZGP+m30HomxoH3EgnhLXS0cTmXG4ku03todkgk6mlmloAgOkfUOKwJVgh/iI7Vbhx0p+he0HghBEv1K9wJeSiNeNBnwvsl3uXGeFpB7EgXhKzBM4A7auv2h8Zi2DTmBTFNgMBJYjNgJW0Am284UfImFi7yQ7gVoEvlM6HAhty5nGBWxfSadgoQLzdmNe4M+TbBfJxCbGRj6fXl7BZtYKxlaKvm2R1rolK7BS4Ay2Z6QzAhMKO4KGnwRrSv0gCOz2/gkYzOhzyJ4LmOHl83cJuNjLAqdbNIohbqw8gJiRD/04zWdytWPCYuLeEvyBaNgyAqs3Y5y9T+KLko64cM5id8hi7I6JlaxRv4J9EFEwGARsMejUe2yvs/1BTefvQqkQON6iu+//sj3Hdg/ZMw8Xm5PcSVwWd4S83ZED4fakYgw8GYFVNsmu0hxXs33INX/On+9S1CfR/h5nGvUCC7BlHebGfnS/MRg48MfOX6ySxym9yjszGR9dbItGpKM8ZQUD3FIR820Uat3H3/jGbbA6PFi5v7DtzjfdUyswVudLbBcKP6o6yPYl2ZWLHSYa06R1tHODdEZMFngf259sd7vfaBnnCbax5PwVYaFzPOAGg16wPj3plcRlmCIw/NgG/TYNMGgQyfcN4DvKI38poozA2czXsh2hNPEashPpxsiHXSZ7NJCNJ45TUiGwDCGs1p/IXuPBuTTj/E2bqEOUmyiwkVtgIrCRAutkBE7ixE+IC5Hdzw5cut6kdMJBYG2V5gUODVYInIJCaPRY5MN2hhcJeCZc4wZ2ZLtlt/ZDbE802NigehKBowgKAidnnBc4zotB/I7KFxpQI/ABdmwOXR0bbL+THcuYr0lvF49oUf7kQjfpFr2X8+FciLfnLQrbM7bvu1xaDrdF0y7jPkcsutEWEQIPOpMRuEsPAofsicDGDlSy9WaGKytwBCY4FsZGiK+vZTfZ7TlerVjVR0lXBu2UXpmKFaxVMwSPRV9QuC0fJHse80CZncZeovzWvUo6gc1QLA9WAFYgbszxhIH/fbJvijpM/zbO4E7ha8Lg40gqDSbqRf14k3eVSPNgxT1P+WMEYr7K9hiFdvezrfsMGSAg6tToBE6HYxx0FAOGYO9ju4lr+Znso9IjZGdqNSGAKaH0pcQK7oEPR0ow03Vc+m8mu5pjH1Yj8HeMezMR2iPL2DJmWB6T3uayH3is1N5eMQYT7gOykw5j+9kwfYixiyx+nJNMFhhARKxmDwYW1/rK+iqz5RiMWV+PJvCieJTsJQgrbQoo9zSVV5wHx5h44ZKAfmJCpoShbbxkzdAkZVplhVLLFhjn3fck/v3R8ZH2EaM8XqQ07W46BnGs9F10PQWVWhDVKAIPc6VNpx4FZMSFB5ekKSJtkv7mqpI+Vn9ZezBNGrBogfOtaLTlHiVcsuaiBmbwl+HbJN7WqdkDOCefJf+4U1FgBDyp4J1D6fwFixE4iTdxrAQW2IwIvJDA1sn+s4TPWvC++GFqDEDJjDP8Zbb1ND32dN8nCixqThuqwZdyn82VNBeYR6a5jGt5VDVWlelUMlXsU0EhyEJSSlPmptwteRdEvsm8dz7LqrcVLQ7Nn6Vq7pdTeyqzOdpyb3e2e2/G4pub/h+mKQGdjmnlFwAAAABJRU5ErkJggg==>

[image41]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAaCAYAAADFTB7LAAAC70lEQVR4Xq1WO2tWQRCdLQIKKgkRtEgVO8EioAQstAuIrYUE/AuWYiHyYaOIhSKCGCx88RWKKBEFC0tBCwu1EcFCLASxUBtBQc/Z193H7P1uHgfOl3vntbMzs3sjQpj4s+lIo2YrNJcboGiarBmmvfdKVgi03bg/lWdEU5P5rwN+F+v2Hwpt08Au8By4pVS0n9uYAe+BP8B/4BhuU7mJvAL/gD/BR+Byrs6Wou9N8GAnkiXwDvgd/ADuTnQ1lLwXIHuNv1899xX6HeBT8HAh17AXvA9uL+Rz4EfwgdQFyFEnaE7g5wIU18RVke1JsQd8LK7aDu0ZPOlZglX8DZ5OhYp/iqi+Li4A28JWfwLnE/1RcCW8aLCWRraKG5fYgSSBM+Av8FAn6jAhUXkorgVYwDwTVtGwCtHtPMgqTwI2aG4JW+gz9uBheYJXtpjrBLAjO5P3Ju6aeOLsAfgLvgSnvYwzteCfHfQtj0Q5QOJG5LMwSawD123wv4HnVfBdZsnASmyWP4AnjE6clyNels+fAuP07MR8Xjz7ks7ftHHjsgj5WXHFmIilImkekvTKuZKrAzIvbuYyZMr+bQGY4HFx886TTlwEvwSjFrjzuSIqhzy9cpL509a3QiQXK16CrWWlmMxi10Q1Vgpr0Bp+3nk80bycZ6pQuYBzN8okuT69XkLcq97Izn5nnjuyHyul0INXhjvRBZRg2ZfDSvMapdcLD9s36RI85eUVqN0Pvi0VCZZN7xDHBOsvR7cLznB6vYQEWdFZmN0OhinCqWJ1yDfgbGZhYXiiX9inQlNA+3IEMMZY4ufNTLmuyXvwOXgsWm4YepYchXAqGzDlt5eReEH7qg/4t2uiAaEbHVAS8NAdNoi1BLW2o/iUohLoUM2ssPspoJW7lnjwUzgu9Zq1JhuE4NgK0NQ7Aa+OS5pCRY+qgeEezYJ79Kg6VEbN7fej31zTajIF3qy2TiW1toOiq0W1ZNMwqU1t5E7afvvD9mtL/AfZn2O6kXd3kwAAAABJRU5ErkJggg==>

[image42]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABwAAAAWCAYAAADTlvzyAAABbUlEQVR4Xp1UK04EQRDtDhaHQ+LICiwCyQW4AsfhAFwAu1m7lqBWkCC5Dq+6e6b+PRNeUkx9Xv06tZQyRbUOxiTkgsP0KcojWZraLV2FacyVmm8WQbIyXZn7yk4my5B2NBibjXj/KENrErF3Dm42edIlkBIyyFUUrM/aK9zqC64hN6T4EIG3STbU7zzBLeQd8g15yujsr3pm1URmm0ow7/E5Qbvg+wy50ozickxbA9esTUZ/HmCcIV+QR8M0ZnAUyuGiC1qANrjUthVtN8husAl48AQ9QI1eID+Qu4jsXf/ZrPsOkF/oH6UfR4xl8imiuLnSsm5X6QLpEvfV3oLLd47WmC7xhBhdp6KwbhJjkjVslgJd5bn2K6VrtS+iXdNSG+ipo0Dbsh5hfZbwp0HQjQOCgI0au5m6Hv6l1Tdor8LLWOf0iHwN6sFcgTQtCEXTh4aEXs/raWKIfT0ltjLiZ2lGwJbICbKmNqxuMEJ/ziISZrXcgI8AAAAASUVORK5CYII=>

[image43]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAAXCAYAAADduLXGAAABP0lEQVR4Xn2Rr0sEURDH53EIgggnuGCwWUS4eBwYLhrFaBGTwf/AYD+wCia9ZjOeSTCIxXggGASDwaZFg+FAP+/H7M7u+vxy35nvm/nu3OxbEQ8XoqY8gsGabUFRO2ZHuv9aTbQrJdprWHNjl6yvjeyUv4GlQ1hGdbSSfYzGAekDtWl2OoFPcMU+6dCX5BfkaiotER7gDXrBmgv0lMIEPZ9qG/ANjipb/Msh6RNxHApxyh6coXeML4RDwjfcUie4gK9wzdRkDl6J39dJ3NcJ+zq/7y1chF31FzSmoeFCw6MP3+GpxHc4T3UZStz3GepkfwM/qF3Yg2c62e87Q3+R7+GYxjb5Gj7COzjw5oLACm7iyiurXsZcQPgNJHw1OSodqWGPCnNlplGNrJnX4b7E66tPrB9y0DXakxNso9FNx1/zRSj2uIOVdQAAAABJRU5ErkJggg==>