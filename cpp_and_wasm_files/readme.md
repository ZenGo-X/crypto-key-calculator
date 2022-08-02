This folder contains the .cpp and.wasm files for wallet generators from given keys.

***Run the code***

Simply run "wasmer run file_name.wasm" to generate the wallet.

***Input and Output Formats***

For both files, input formats are as follows.

The first line contains the number of keys.

Then, for each of the following lines, each line indicates one key by 4 numbers, p_safe, p_leak, p_lost, p_stolen (all integers denoting percentage).

See the first several lines in the cpp source code (or simply run the code) for details of the output format.

***Efficiency***

For the deterministic version, we can generate the wallet using at most 6 keys and the output is always the optimal wallet.

Benchmark: For 1-5 keys, the wallet is generated within 0.1 sec, while it takes around 10 secs for 6 keys.

For the approximate version, we output a wallet combined by a subset of keys of size 5 or 6 which is near optimal.

Benchmark: For 8 keys, the wallet is generated within 12 secs, while the time increases to 22 secs for 16 keys.

