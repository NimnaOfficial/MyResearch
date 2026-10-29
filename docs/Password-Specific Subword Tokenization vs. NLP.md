# Password-Specific Subword Tokenization vs. NLP

- **Standard subword methods (BPE, WordPiece, Unigram) are not optimized for passwords.** They merge characters purely by frequency, without regard to meaningful substrings.  For example, applying a typical BPE model (trained on natural language) to a password like `"p@ssw0rd4ever"` tends to break it into small fragments (e.g. `"p@"`, `"ss"`, `"w0"`, `"rd"`, `"4"`, `"ever"`), losing the recognizable words **“p@ssw0rd”** and **“4ever.”**  In contrast, password-specific methods preserve frequent “chunks.”  Ghafari *et al.* show that a byte-level BPE trained on passwords (`BBPE-AE`) can extract common tokens without arbitrary length limits, yielding realistic password segments.  Similarly, the PwdSegment algorithm (a password-tailored BPE) merges the most frequent character pairs in a password corpus, stopping when an average chunk length is reached.  This produces human-recognizable tokens: e.g. it learns the chunk “p@ssw0rd” and “4ever” from multiple instances of `"p@ssw0rd4ever"`.  In short, **standard NLP tokenizers over-segment passwords** because they do not account for common leetspeak or multi-word structures.  

- **Modifications to preserve meaningful tokens:**  To prioritize morphologically rich words, one can adapt BPE to respect semantic “anchors.”  For instance, PwdSegment uses a tunable **avg_len** parameter so that only a limited number of merges are done, yielding coarser chunks.  One could also bias merges to protect known dictionary roots: e.g. seed the merge process so that common words (like “dragon” or “password”) remain intact unless there is strong evidence to split them.  Another idea is to perform a preliminary pass that identifies likely dictionary words (via a wordlist or a morphological analyzer) and treat those as indivisible tokens before running BPE on the rest.  In practice, password-specialized BPE variants (like PwdSegment) automatically **preserve frequent substrings**: after training, the string `"p@ssw0rd4ever"` is segmented as `[“p@ssw0rd”, “4ever”]`, keeping the semantic parts together.  

- **Illustration:** Traditional BPE merges are blind to semantics (they merge *all* frequent char pairs). In contrast, a modified BPE might rank merges not just by raw frequency but also by heuristics (e.g. longer resulting tokens, dictionary membership, or “meaningfulness”).  For example, one could require that any merge that would break a known root word (like “dragon” in “dragon123”) incurs a penalty or is disallowed.  Another strategy is to merge characters **only up to a length threshold** (like PwdSegment’s avg_len) so that very long words stay intact unless unusually frequent as fragments.  These changes yield tokens that align better with human concepts in passwords (dates, names, dictionary words, leetspeak segments) rather than arbitrary subwords.  

## Character-Class Boundary Detection & Segmentation

- **Basic class-chunking algorithm:**  A robust approach is to scan the password and split whenever the character class changes. Define classes: letters (`A-Z` or `a-z`), digits (`0-9`), and symbols (e.g. punctuation).  Iterate through characters; whenever you move from one class to another, insert a boundary.  For example, `"Dragon1999!"` would break as `["Dragon", "1999", "!"]` (letters, then digits, then symbol).  This simple rule captures most obvious boundaries. 

- **Refinements:**  In addition, treat whitespace and explicit delimiters as hard breaks.  If the password contains spaces or hyphens (as in passphrases), split on those: e.g. `"Correct-Horse BatteryStaple"` → `["Correct", "Horse", "Battery", "Staple"]`.  Also handle CamelCase: whenever a lowercase letter is followed by an uppercase (e.g. `"fooBar"`), split between them.  A typical heuristic is to apply a regex like `(?<=[a-z])(?=[A-Z])` to break on case transitions.  Thus `"camelCasePassword"` would become `["camel", "Case", "Password"]`.  

- **Producing PCFG-style templates:**  Once tokens are delimited, identify each chunk’s type.  For the Probabilistic CFG approach, every password chunk is ultimately mapped to a class-length tag (L=letters, D=digits, S=symbols).  For example, “Dragon” (6 letters) becomes `L6`, “1999” becomes `D4`, and “!” becomes `S1`.  Weir et al.’s original PCFG represents the *structure* of “lastforever” as “L11” (11 letters), and similarly use `D` and `S` for numeric or symbol runs.  In practice, the trainer will also try to match letter-chunks to dictionary words or sub-rules.  If a segment matches a known word (like “dragon” or “password”), it may be treated as a single lexical token in the grammar; otherwise it stays as a generic letter-run.  The output “template” for each password is thus a sequence like `L6D4` or `W6L4D2` (if we tag “W6” for a recognized 6-letter word). 

- **PCFG extraction in training:**  During PCFG training, each password from the corpus is automatically broken into these class segments and (if possible) dictionary roots.  The NIJ/IEEE paper explains that the system *“automatically create[s] a probabilistic context-free grammar based upon a training set of previously disclosed passwords”*.  Concretely, the trainer scans each password: any contiguous letters are tentatively mapped to either known dictionary words or generic letter runs, digits to a digit run, symbols to a symbol run.  These pieces form a grammar rule (e.g. “L3 D2” from “cat42”).  The frequencies of each segment and each combination become the rule probabilities.  In effect, the base **L/D/S template is learned automatically** – e.g. many passwords of the form “(letters)(digits)” will give high weight to a rule like `LxDy`.  The result is a set of rewriting rules such as `ROOT → LxDy` (where the actual characters are generated by further rules).

## Morphological Clustering & Variant Grouping

- **Clustering by sound and edit distance:**  To group leetspeak and misspellings, one can apply phonetic and string-similarity algorithms.  For each **alphabetic** chunk (after stripping digits/symbols), compute a phonetic code (e.g. Double Metaphone).  Chunks with identical or near-identical codes are likely the same root (e.g. “password”, “passwerd”, “p@ssword” all sound like **PASWRD**).  In parallel, compute pairwise edit distances: if the Levenshtein (or Damerau-Levenshtein) distance between two chunks is very small (say ≤2), cluster them together.  In practice, one would form clusters such as {“password”, “p@ssw0rd”, “passwerd”}.  These become a single high-frequency semantic node in the model, representing the root idea “password” despite variations.  

- **Building substitution probabilities:**  Once clusters of variants are identified (each cluster anchored by a canonical “root” string), we can count how characters are systematically substituted.  Align each variant with the root (e.g. aligning “p@ssw0rd” with “password” shows `a→@`, `o→0`).  Tally these substitutions across the training set to form a matrix.  For example, count how often letter “a” is replaced by “@”, how often “o” is replaced by “0”, “e” by “3”, etc., as well as the null substitutions (characters left unchanged).  Normalize each row to get probabilities: e.g. *P(→@ | a) = count(a→@)/count(a→anything)*.  This yields a character-level **substitution probability matrix**.  It can be incorporated into the PCFG model (or Markov chains) by treating an observed symbol as a noisy version of an underlying letter with known probability.  

- **Mathematical approach:**  Formally, if $\mathcal{C}$ is the set of character clusters (e.g. {'a','@','4'} for “a”), we estimate $P(c'|c)$ for $c,c'\in \mathcal{C}$ as 
  $$P(c'\mid c) = \frac{\text{count of substitutions }c\to c'}{\sum_{x\in\mathcal{C}}\text{count}(c\to x)}.$$ 
  One can smooth this matrix (e.g. add a small epsilon to all counts) to avoid zeros.  In practice, this matrix guides a noisy channel model: if the PCFG wants to generate the word “password”, it can also generate “p@ssw0rd” via the high-probability substitutions $a\to@$ and $o\to0$. 

## Multi-Token Passphrase Grammars

- **Long multi-word passphrases:**  Modern users often choose *passphrases* (e.g. >15 characters formed by several common words).  These follow natural-language patterns (the famous example *“CorrectHorseBatteryStaple”* is a noun-noun-noun-noun sequence).  Studies have found that a significant fraction of long passwords exhibit clear grammatical structure (e.g. “a bigger better password” follows “Det Adjective Adjective Noun”).  A PCFG can be extended to model such sequences by treating each word as a terminal and associating it with a part-of-speech.  

- **POS-based patterns:**  One method is to tag each word of a candidate passphrase with its POS (using a standard tagger or a custom lexicon).  Then the PCFG’s non-terminals include POS categories (Adj, Noun, Verb, etc.) and the grammar learns rules like `S→ Adj Noun Verb Noun`.  For example, given many examples of adjectival phrases, the grammar might learn `Adj→{"correct", "big", ...}`, `Noun→{"horse","battery",...}`, and a rule `S→Adj Noun Noun Noun`.  Using POS patterns dramatically shrinks search space for passphrases because it only generates sequences that match common grammar patterns.  

- **Word boundary parsing:**  In practical parsing, we first separate by whitespace/hyphen (e.g. split on `/[\s-]+/`) and by CamelCase as noted above.  Each resulting token is looked up in a wordlist or tagged by POS.  This yields a sequence of known words like `["correct","horse","battery","staple"]`.  The PCFG structure for this phrase could be represented as `Noun+Noun+Noun+Noun` (or more specifically `Adj Noun Noun Noun` if “correct” is tagged as adjective).  If whitespace or hyphen is present, it directly indicates a new word.  If CamelCase split a token (e.g. “FooBarBaz” → `["Foo","Bar","Baz"]`), treat each as a separate word.  

- **PCFG incorporation:**  To include multi-word grammar in PCFG, treat space-separated words like separate nonterminals in the production.  For example, define a top-level rule such as `S → X Y Z`, where each X, Y, Z might further expand into a category (Noun, Verb, etc.).  The probabilities of these expansions come from counting how often, say, an adjective-noun pattern appears in the training corpus of passphrases.  In essence, a multi-word passphrase generates a structural mask like `[Adjective][Noun][Verb][Noun]` which can be realized as a sequence of dictionary words (e.g. “quick fox jumps dog”).  This POS pattern becomes part of the grammar: the model learns which part-of-speech sequences are common in user-chosen passphrases.  

## Technical Blueprint & Pseudocode

Putting it all together, an end-to-end cracking model would follow these steps:

- **Preprocess the password string:** Lowercase it or normalize case if needed (unless preserving case is important). Remove or collapse extraneous whitespace/hyphens only if modeling them as separators, not as characters. 

- **Detect character-class boundaries:** Scan and split the string at every change of class, and at spaces or hyphens. Also split on CamelCase transitions.  For example:  
  ```python
  import re
  def split_by_class(s):
      # Split on whitespace and hyphen first
      parts = re.split(r'[\s\-]+', s)
      chunks = []
      for part in parts:
          # Break camelCase (lower->Upper)
          subparts = re.findall(r'[A-Z]?[a-z]+|[A-Z]+(?![a-z])|\d+|[^A-Za-z0-9]+', part)
          # Now ensure separate letter/digit/symbol runs
          for sp in subparts:
              # Already separated camel-cased words, now further break mixed content
              i = 0
              for j in range(1, len(sp)):
                  if (sp[j].isdigit() and not sp[i].isdigit()) or \
                     (sp[j].isalpha() and not sp[i].isalpha()) or \
                     (not sp[j].isalnum() and sp[j] != sp[i]):
                      chunks.append(sp[i:j]); i = j
              chunks.append(sp[i:])  # remainder
      return [chunk for chunk in chunks if chunk]
  
  # Example:
  passwd = "Dragon1999-Blue_88C"
  print(split_by_class(passwd))
  # -> ['Dragon', '1999', 'Blue', '_', '88', 'C']
  ```

- **Extract root tokens:**  For each chunk from above:
  - If it is alphabetic (`chunk.isalpha()`): check against a dictionary or wordlist.  If it matches a known word (like “dragon” or “blue”), label it as a semantic root; otherwise treat it as a generic letter-run.  You could also apply phonetic normalization: e.g. map “knight” and “nite” to the same key to detect variants. 
  - If it is digits: keep it as a digit chunk.
  - If it is symbols: keep as symbol chunk.
  - For leetspeak within alphabetic chunks, one strategy is to revert common substitutions first (e.g. `chunk = chunk.replace('@','a').replace('3','e')` etc.) and re-check the dictionary.  

- **Map to PCFG structural mask:**  Build a string or list that represents the structure.  For example:
  ```python
  def pcfg_mask(tokens, dictionary):
      structure = []
      for tok in tokens:
          if tok.isalpha():
              norm = tok.lower()
              if norm in dictionary:
                  # Known word of length n
                  structure.append(f"W[{len(tok)}]")
              else:
                  # Pure letter sequence
                  structure.append(f"L[{len(tok)}]")
          elif tok.isdigit():
              structure.append(f"D[{len(tok)}]")
          else:
              structure.append(f"S[{len(tok)}]")
      return structure

  # Example continued:
  chunks = ['Dragon','1999','Blue','_','88','C']
  dict_words = {'dragon','blue'}  # example dictionary
  print(pcfg_mask(chunks, dict_words))
  # -> ['W[6]', 'D[4]', 'W[4]', 'S[1]', 'D[2]', 'L[1]']
  ```
  Here `"Dragon"` and `"Blue"` (length 6 and 4) become `W[6]` and `W[4]` (denoting dictionary words), `"1999"` yields `D[4]`, the symbol `"_"` yields `S[1]`, `"88"` yields `D[2]`, and `"C"` (a single letter not in `dictionary`) yields `L[1]`.  Together this is the PCFG structure.  (In a real implementation, one would accumulate the probabilities of each fragment and each structure rule from training data.)  

- **PCFG structural masks:**  The final output mask (joined with dashes or spaces) represents the grammar template.  For example, the structure above might be joined to **`W[6]-D[4]-W[4]-S[1]-D[2]-L[1]`**.  This can be translated to a PCFG rule like `S → W6 D4 W4 S1 D2 L1` (with the actual generation of “Dragon”, “1999”, etc. deferred to separate rules or probabilities).  

- **Password guess generation (beyond parsing):**  With this model, the cracker can then generate candidates by sampling from the learned distribution over structures and tokens.  For each position marked `W[k]`, it might choose a frequent k-letter word (like “dragon” for W[6]), or for `L[k]` choose a letter pattern, and so on.  The substitution probability matrix is applied so that, e.g., generating “password” might also produce “p@ssw0rd” with its learned probability.  PCFGs generate guesses in order of descending probability, using the learned rules from all these components.  

In summary, building a password-optimized PCFG system involves: learning meaningful **subword chunks** (via modified BPE like PwdSegment); accurately **segmenting** each password at class and word boundaries; clustering similar variants via phonetic/edit-distance; and then assembling a PCFG template that includes multi-word grammar patterns and substitution rules.  The above pseudocode outlines the core parsing and masking logic: after sanitizing a password, it splits into letter/digit/symbol runs (respecting spaces, hyphens, CamelCase), identifies each root token, and emits a PCFG-style structural signature (e.g. `W[6]-D[4]-L[2]`).  This complete parsing algorithm is the backbone of a PCFG-based cracking engine.

**Sources:** Weir *et al.* originally described the PCFG framework of extracting password structures and guessing rules.  The PwdSegment method (using BPE on passwords with an average-length cutoff) is detailed in recent research.  Ghafari *et al.* show how byte-level BPE can model password patterns.  The effect of grammatical (POS) structure in long passphrases is analyzed by Rao *et al.*.  Throughout, we combine these ideas into a comprehensive parsing blueprint optimized for password cracking.