# Behavioral Models of Human-Selected Passwords

## Cognitive Load & Chunking Limits  
Human memory is severely limited: young adults can hold only about four “chunks” in working memory.  In practice this means users encode passwords as semantic chunks (words or meaningful units) rather than random strings.  For example, turning “12101946” into the chunked date “12/10/1946” illustrates how chunking bypasses the raw entropy limit.  Studies confirm that passphrases (e.g. a short familiar sentence) are easier to recall than random characters.  In effect, a user-chosen password’s theoretical entropy is collapsed into a few meaningful chunks, each contributing only a few bits.  

## Cognitive Heuristic Model of Password Generation  
Users typically apply a small set of cognitive heuristics when creating passwords:  

- **Anchor Selection:**  A personal “anchor” (e.g. a name, nickname, hobby, or phrase) is chosen as the base.  This base-word often has high personal or emotional significance (biographical or relational identity anchors) and so low cryptographic entropy.  Users exploit familiar verbal chunks.  
- **Policy Padding:**  To satisfy composition rules (min length, character classes), users append or insert easily memorable tokens.  For example, if a symbol or digit is required, they will simply add “1” or “!” at the end.  NIST notes that “password” often becomes “Password1” or “Password1!” when an uppercase, digit, or symbol is mandated.  In effect, each padding element adds only a few bits (e.g. appending “1” adds ~log₂10≈3.3 bits).  
- **Orthographic Mutation:**  Users replace letters with look-alike characters (leetspeak).  Common substitutions are extracted from leaked datasets: e.g. **A**→{“4”, “@”}, **S**→{“$”, “5”}, **E**→“3”, **I/L**→“1” or “!”, **O**→“0”, **T**→“7”.  A mutation matrix might look like:  
  ```json
  "substitutionMatrix": {
    "a": {"4":0.15, "@":0.10},
    "e": {"3":0.20},
    "i": {"1":0.18, "!":0.05},
    "o": {"0":0.17},
    "s": {"$":0.12, "5":0.08},
    "t": {"7":0.10},
    "l": {"1":0.07}
  }
  ```  
  (Values are illustrative estimates; common leets are confirmed by sources.)  
- **Temporal Iteration:**  When forced to change a password over time, users perform minimal edits (often numeric increments or symbol rotations).  For example, a 90-day reset might transform `Password1` → `Password2`, or replace “1”→“2” and “@”→“#”.  Such small-step transitions form edges in a password-evolution graph.  NIST explicitly warns that composition rules yield “Password1” or “Password1!” from “password”, illustrating these trivial transitions.  

Each heuristic contributes only a few bits of extra entropy.  They are highly exploitable: cracking tools simply enumerate these edits (e.g. grammar rules that append “1” or substitute “e→3” for each dictionary word).  

## Satisficing & Positional Biases  
Users “satisfice” by picking a template that meets policy with minimal effort.  In leaked corpora, just a few structural templates dominate.  For example, one analysis found:  
- `U7L4D` (1 uppercase + 7 lowercase + 4 digits) occurred ~7.13% of the time.  
- `U8L3D` occurred ~5.36%, and `U9L2D` ~3.63%.  
These correspond to patterns like “Aabcdefg1234” or “Password123”.  A sketch of top patterns (estimated MLE frequencies) might be:  
```json
"templates": {
  "U7L4D": 0.0713,
  "U8L3D": 0.0536,
  "U9L2D": 0.0363,
  "L8":   0.20,    // e.g. 8-letter lowercase (from another study)
  // … (additional templates sum to ~0.5 of corpus)  
}
```  
These core masks (e.g. `L8D2`, `L6D4`, etc.) cover roughly half of all passwords.  

Positional biases within those templates are extreme.  Empirical analyses show **>85–90%** of uppercase letters (when required) appear at index 0.  Likewise, digits and symbols are heavily skewed to the end of the string.  For example:  

- *Uppercase at start:* If an uppercase is used, it is placed first in ~90% of cases.  
- *Digit/Symbol at end:* Most digits occur as a contiguous block at the tail (commonly 2 or 4 digits at end).  Similarly, when a symbol is added to satisfy policy, it usually goes at the very end.  

A positional-bias schema (for modeling) might be:  
```json
"positionalBias": {
  "uppercase_at_start": 0.90,
  "digit_at_end": 0.90,
  "symbol_at_end": 0.85
}
```  
(Exact values depend on enforcement; the cited study reports “over 90%” for uppercase-first and similarly high for final-digit placement.)  

## Spatial Topography & Motor Biases  
Users also exploit keyboard spatial layout.  Leaked passwords often contain **keyboard walks** – sequences of adjacent keys.  For example, “1qaz2wsx” corresponds to moving down from “1” to “q” to “a” etc.  The adjacency graph for QWERTY can be encoded (edges connect physically neighboring keys).  For instance:  
```json
"keyAdjacency": {
  "1": ["q","a"], "2": ["w","s"], "3": ["e","d"], "4": ["r","f"], 
  "q": ["1","a","w"], "w": ["2","s","e","q"], 
  "e": ["3","d","r","w"], 
  // ... (and so on for all keys in QWERTY)
}
```  
This matrix (or graph) defines possible one-step moves (horizontal, vertical, diagonal).  Analysis shows higher transition probabilities along left-to-right and top-to-bottom directions (consistent with reading order and finger ergonomics).  For example, a common pattern is “1234” (left-to-right on the top row) or “1qaz” (diagonal down).  

Desktop vs. Mobile: These patterns differ on mobile devices.  Desktop users type with multiple fingers; common strokes can be long horizontal runs.  On mobile touchscreens, most people type one-handed (usually right-thumb).  Thumb input introduces systematic offset biases (e.g. touches skew towards the right/bottom) and tends to favor shorter, more vertical motions.  Studies find right-thumb typing “shifts [touches] slightly to the lower right” and tends to reach into the left side less comfortably.  In modeling, one might weight horizontal (left→right) transitions higher for desktop, and more central or upward moves for mobile.

## Orthographic Mutations & Leetspeak  
Building on the mutation model above, we enumerate all common character substitutions and transformation rules.  As noted, frequent substitutions include A→{4,@}, S→{$,5}, plus analogous mappings (E→3, I/L→1, O→0, T→7, etc.).  A complete substitution-probability matrix (learned from large leaks) would list for each letter its chance to be replaced by each symbol.  For example:  
```json
"substitutionMatrix": {
  "a": {"4":0.15, "@":0.10},
  "e": {"3":0.20},
  "i": {"1":0.18, "!":0.05},
  "o": {"0":0.17},
  "s": {"$":0.12, "5":0.08},
  "t": {"7":0.10},
  "l": {"1":0.07}
  // … (plus mappings for other letters)
}
```  
We also include **secondary mutations** like doubled letters, vowel deletions, and case alternation.  For instance:  
- **Doubling:** Repeating a character (e.g. “passsword” vs “password”).  Some users add extra letters to “sound out” a password.  
- **Vowel deletion:** Dropping vowels (e.g. “p@sswrd” for “password”). This trims a base word.  
- **Case inversion:** Flipping case on some or all letters (e.g. “pAsSwOrD”).  Often users alternate case for “security”, but patterns (like lowercase-lowercase-uppercase) may emerge.  

Empirical studies confirm that such modifications are common but limited.  In particular, Y. Li et al. (2021) found only ~1% of passwords use any leetspeak and even high-frequency leets raised cracking rates by <1%.  Nonetheless, our generation model should allow these transforms (with lower probabilities).  

## Psychosocial Anchoring & Evolutionary Reuse  
Passwords often reuse personal or emotional anchors.  Common **identity anchors** include names (self, family, pets), significant dates, and hometowns.  These carry positive emotional valence (e.g. “Baby” or “Love”) and are easy to remember.  For example, Chinese users frequently choose passwords similar to Pinyin (Romanized Chinese) words or homophonous number phrases.  The cited study found Chinese password content “more similar to the Pinyin context and Chinese number homonym” compared to Western users.  Likewise, Japanese users often use keyboard-walk sequences or transliterated local words (Romaji) as bases.  

Cross-cultural grammar rules can be formalized.  For Chinese, one could add productions like `<CN>` → Pinyin sequences (e.g. “zhong1guo2”) or numeric homophones (“520” for “wo ai ni”).  For Japanese, a `<JP>` nonterminal might expand to common Romaji syllables or keystroke clusters.  (Research on South Asian passwords is sparse, but one would analogously include romanized Hindi/Urdu patterns or local place names.)  

Finally, **evolutionary reuse** ties passwords across contexts.  Users often modify an old password slightly for a new account or policy cycle.  This can be modeled as a directed graph where each node is a password state and edges are small mutations.  A typical 90-day reset path is a simple cycle: e.g. `Password1` → `Password2` → `Password3`, often accompanied by rotating through symbols (“!”→“@”→“#”) or appending year/month.  NIST’s example of `password`→`Password1`→`Password1!` exemplifies a 2-step evolution graph.  Similarly, cross-platform reuse may produce multi-account edges (e.g. same base with service-specific suffix).  In sum, we can encode a state-transition matrix whose entries are probabilities of each transformation (increment, symbol change, etc.).  For instance:  
```json
"evolutionTransitions": {
  "Password": {"Password1":0.60},
  "Password1": {"Password2":0.50, "Password1!":0.50},
  "Password!": {"Password@":0.40}
  // …
}
```  
These values are illustrative; real data would come from longitudinal password-change logs.  

## Feature-Extraction Schemas for Machine Learning  
To train classifiers or generative models, we extract features across several categories.  An example JSON schema of features:  
```json
{
  "morphological": [
    "length", "num_uppercase", "num_lowercase", "num_digits", "num_symbols",
    "entropy_estimate", "dictionary_match_flag", "num_repeated_chars"
  ],
  "sequential": [
    "bigram_transition_scores", "markov_order2_score", "keyboard_walk_length",
    "vowel_consonant_pattern"
  ],
  "spatial": [
    "avg_key_distance", "horizontal_move_pct", "vertical_move_pct",
    "one_hand_input_flag", "finger_travel_distance"
  ],
  "orthographic": [
    "leet_substitution_count", "vowel_drop_flag", "case_alt_flag",
    "common_substitution_score"
  ],
  "positional": [
    "uppercase_first_flag", "digit_last_flag", "symbol_last_flag",
    "prefix_nonletter_length", "suffix_digit_length"
  ]
}
```  
These features correspond to model inputs:  
- *Morphological:* captures structure (length, character-class counts, dictionary-word checks).  
- *Sequential:* covers character sequences (Markov-chain or n-gram probabilities).  
- *Spatial:* captures keyboard topology (e.g. frequency of adjacent-key moves, dominant direction, one-thumb bias).  
- *Orthographic:* counts of substitutions or unusual spellings (e.g. number of leet replacements).  
- *Positional:* binary/length features for placement of character classes (e.g. uppercase at index 0, digits at end, etc).  

Each extracted feature is numeric or categorical, suitable for discriminative models.  These schemas can be directly encoded in Python/JSON for use in a PCFG or Markov-chain password generator.  

**Sources:** This blueprint synthesizes findings from cognitive psychology and password-security research.  Key references include Cowan’s working-memory model, password habit studies, and leetspeak analyses, all of which inform the numerical distributions and rules above.