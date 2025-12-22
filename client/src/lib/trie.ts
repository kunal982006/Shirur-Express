class TrieNode {
    children: Map<string, TrieNode>;
    isEndOfWord: boolean;
    value: string | null;

    constructor() {
        this.children = new Map();
        this.isEndOfWord = false;
        this.value = null;
    }
}

export class Trie {
    root: TrieNode;

    constructor() {
        this.root = new TrieNode();
    }

    insert(word: string, value: string = word) {
        let current = this.root;
        const lowerWord = word.toLowerCase();

        for (const char of lowerWord) {
            if (!current.children.has(char)) {
                current.children.set(char, new TrieNode());
            }
            current = current.children.get(char)!;
        }
        current.isEndOfWord = true;
        current.value = value; // Store the original case or related value
    }

    search(prefix: string): string[] {
        let current = this.root;
        const lowerPrefix = prefix.toLowerCase();

        for (const char of lowerPrefix) {
            if (!current.children.has(char)) {
                return [];
            }
            current = current.children.get(char)!;
        }

        return this.findWords(current);
    }

    private findWords(node: TrieNode): string[] {
        let results: string[] = [];

        if (node.isEndOfWord && node.value) {
            results.push(node.value);
        }

        for (const child of Array.from(node.children.values())) {
            results = results.concat(this.findWords(child));
        }

        return results;
    }
}
