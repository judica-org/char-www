import { ClipboardEventHandler, createRef, KeyboardEvent, MutableRefObject, RefObject, useEffect, useRef, useState } from "react";
import * as ecc from '@bitcoin-js/tiny-secp256k1-asmjs';
import * as bitcoin from "bitcoinjs-lib";
import * as bip32 from "bip32";
import { mnemonicToSeedSync, validateMnemonic, wordlists } from "bip39";
import { sha256 } from "bitcoinjs-lib/src/crypto";
import { closest } from "fastest-levenshtein";
import { getPublicKey, nip19, } from 'nostr-tools';
import { authentic_list } from "./authentic_list";


bitcoin.initEccLib(ecc);
const bip32_instance = bip32.BIP32Factory(ecc);
const WORDS_ARR = wordlists["english"];
const WORDS = new Set(wordlists["english"]);
export interface SeedResult {
    address: any,
    key: bip32.BIP32Interface,
    nsec: `nsec1${string}`,
    npub: `npub1${string}`
}
interface SeedPhraseEntryProps {
    set_result: (arg0: SeedResult) => void
}
export const SeedEntry: React.FC<SeedPhraseEntryProps> = ({ set_result }) => {

    const [words, setWords] = useState(Array(24).fill(""));
    const [suggestions, setSuggestions] = useState(Array(24).fill(""));
    const inputRefs = useRef<RefObject<HTMLInputElement>[]>([]);
    const [error, set_error] = useState<string | null>(null);

    useEffect(() => {
        inputRefs.current = Array(24).fill(null).map(() => createRef());
    }, []);
    function word_is_suggested(index: number) {
        return suggestions[index] === words[index].trim();
    }
    const validateWords = (words: string[]) => {
        const invalidWords = words.filter(word => word && !WORDS.has(word));

        if (invalidWords.length) {
            set_error(`Invalid Seed Words: ${invalidWords.join(', ')}`);
            return;
        }

        if (words.filter(Boolean).length !== 24) {
            set_error("Please enter all 24 words");
            return;
        }

        const phrase = words.join(" ");
        if (!validateMnemonic(phrase)) {
            set_error("Invalid Seed Phrase (CheckSum Failed)");
            return;
        }

        const seed = mnemonicToSeedSync(phrase, "jeremy season");
        const key = bip32_instance.fromSeed(seed, bitcoin.networks.bitcoin);
        const new_nsec = nip19.nsecEncode(key.privateKey ?? Buffer.from([]))
        const publicKey = getPublicKey(Uint8Array.from(key.privateKey ?? []));
        const npub = nip19.npubEncode(publicKey);
        const xkey = Buffer.from(ecc.xOnlyPointFromPoint(key.publicKey));
        const { address } = bitcoin.payments.p2tr({
            internalPubkey: xkey,
            network: bitcoin.networks.bitcoin,
        });

        const check = sha256(Buffer.from(("[JEREMY SEASON]" + key.privateKey?.toString('hex')) ?? ""));
        const hashed_drop_list = authentic_list.has(check.toString("hex"));
        if (!hashed_drop_list) {
            set_error(`Not a whitelisted seed ${check.toString("hex")}`);
            return
        }
        else {
            if (!address || !new_nsec) {

                set_error("Invalid Seed Phrase")
                return
            }
            set_result({
                address: address,
                key: key,
                nsec: new_nsec,
                npub: npub,
            })
            set_error(null);
        }
    };

    const handleInput = (index: number, value: string) => {
        const newWords = [...words];
        newWords[index] = value.toLowerCase();
        setWords(newWords);

        if (value) {
            const suggestion = closest(value, Array.from(WORDS));
            const newSuggestions = [...suggestions];
            newSuggestions[index] = suggestion === value ? "" : suggestion;
            setSuggestions(newSuggestions);
        } else {
            const newSuggestions = [...suggestions];
            newSuggestions[index] = "";
            setSuggestions(newSuggestions);
        }

        validateWords(newWords);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
        if (e.key === 'Tab' || e.key === 'Enter') {
            e.preventDefault();
            if (suggestions[index]) {
                const newWords = [...words];
                newWords[index] = suggestions[index];
                setWords(newWords);
                const newSuggestions = [...suggestions];
                newSuggestions[index] = "";
                setSuggestions(newSuggestions);
                validateWords(newWords);
            }
            inputRefs.current[(index + 1) % 24].current?.select();
        }
    };

    const handlePaste: ClipboardEventHandler<HTMLInputElement> = (e) => {
        e.preventDefault();
        const pastedText = e.clipboardData?.getData('text') ?? "";
        const pastedWords = pastedText.trim().split(/\s+/);

        if (pastedWords.length === 24) {
            setSuggestions(pastedWords.map((word, idx) => {
                const s = closest(word, WORDS_ARR);
                console.log(s, word, s === word ? "" : s);
                return s === word ? "" : s;
            }));
            setWords(pastedWords);
            validateWords(pastedWords);

        }
    };
    return <div>
        <p className="color:red">{error ?? "Enter in a seed..."}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {words.map((word, index) => (
                <div className="relative flex items-center" key={`word-${index}`}>
                    <div className="mr-2 text-gray-500">
                        {1 + index}.
                    </div>
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={word}
                            onChange={(e) => handleInput(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            ref={inputRefs.current[index]}
                            className="w-full p-2 border rounded"
                            placeholder={suggestions[index] || `Word ${index + 1}`}
                            onPaste={handlePaste}
                            style={{ color: suggestions[index] ? "red" : "green" }} />
                        {suggestions[index] && (
                            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
                                {suggestions[index]}
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    </div>;
}
