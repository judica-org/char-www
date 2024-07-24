"use client"
import Image from "next/image";
import { getPublicKey, getEventHash, Relay, nip19, } from 'nostr-tools';
import { finalizeEvent, UnsignedEvent, verifyEvent } from 'nostr-tools/pure'
import { SecretField } from "./SecretField";
import { SeedEntry, SeedResult } from "./SeedEntry";
import { useState } from "react";

// ... (rest of the imports and initial setup remain the same)

export default function Home() {
  const [message, setMessage] = useState('');

  const [seed, set_result] = useState<null | SeedResult>(null);
  const [activated, set_activated] = useState(false);

  const activate = async () => {
    if (!seed) {
      return
    }
    if (activated) return;
    try {

      await connect_and_relay_message(seed, "char pill activation @npub1c8ehx8f3ktpnuuzylgpdme3vuts0620ycqksnvvj6kxat96k0h9suvg50j");
    } catch {
      return;
    }
    finally {
      set_activated(true);
      console.log("ACTIVATED CHAR");
    }
  };
  const handleSendMessage = async () => {
    if (!message) {
      alert('Please enter a message');
      return;
    }
    if (!seed) {
      return
    }
    await connect_and_relay_message(seed, message);
    console.log('Message sent:', message);
    setMessage('');
  };



  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <Image
            className="inline-block dark:drop-shadow-[0_0_0.3rem_#ffffff70] dark:invert"
            src="/next.svg"
            alt="Next.js Logo"
            width={180}
            height={37}
            priority
          />
        </div>


        {seed === null && (

          <>

            <p>Thanks for checking us out -- follow for updates <a
              href="https://twitter.com/char_btc">@char_btc</a>.  If you received a
              char pill from Jeremy enter the seed phrase now.
            </p>
            <SeedEntry set_result={set_result}></SeedEntry>

          </>

        )}

        {seed !== null && (

          <>
            <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
              <div className="mb-6">
                <h1>


                  Congratulations on the receipt of your Char pill.
                </h1>
                <p>

                  The seed
                  phrase on the paper you received was generated, printed, and
                  deleted and then hand-delivered to you by Jeremy. It is
                  password encrypted with <b>{'"'}jeremy season{'"'}</b>, should you want to
                  use it in another platform (no guarantees that Jeremy or his
                  devices used to create it are not compromised, do not put
                  large value on these keys).
                </p>
                <p>
                  The phrase will be used for a future participation activity. Save it!
                  For now, clicking the button below activates your char pill.
                </p>
                <button
                  onClick={activate}
                  disabled={activated}
                  style={{ backgroundColor: activated ? "grey" : "" }}
                  className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
                >
                  Click to Activate Char Pill

                </button>
                <p>
                  You can use the below text field to publish information via Nostr to use your char pill
                  in future activities.
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter a publicly visible note"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                />
                <button
                  onClick={handleSendMessage}
                  className="mt-2 w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
                >
                  Send
                </button>
              </div>

              <div className="border-t pt-6">
                <h2 className="text-xl font-bold mb-4">Nostr Info</h2>
                <div className="space-y-3">
                  <div>
                    <a href={`https://coracle.social/${seed.npub}`}
                      target="_blank"
                    >
                      <p className="text-sm text-gray-600">NPUB (Click to View)</p>
                      <p className="font-mono text-sm break-all bg-gray-100 p-2 rounded">{seed.npub}</p>
                      </a>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">NSEC:</p>
                    <div className="bg-gray-100 p-2 rounded">
                      <SecretField value={seed.nsec} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </>
        )}
      </div>
    </main >

  );

}
async function connect_and_relay_message(seed: SeedResult, message: string) {
  const relay = await Relay.connect('wss://relay.damus.io');

  await relay.connect();

  const publicKey = getPublicKey(Uint8Array.from(seed.key.privateKey ?? []));

  var event: UnsignedEvent = {
    kind: 1,
    pubkey: publicKey,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: message
  };

  const signed_event = finalizeEvent(event, Uint8Array.from(seed.key.privateKey ?? []));
  relay.publish(signed_event);
}

