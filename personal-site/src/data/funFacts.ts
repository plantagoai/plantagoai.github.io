export type FunFact = { category: string; text: string };

export const funFacts: FunFact[] = [
  {
    category: "Distributed",
    text: "Leslie Lamport submitted his Paxos paper as a parable about ancient Greek archaeologists. Reviewers thought it was a joke and rejected it. Eight years later, the same paper became the foundational consensus algorithm of the cloud era.",
  },
  {
    category: "Distributed",
    text: `The CAP theorem isn't "pick two of three." It's "pick one of two when there's a network partition." Brewer himself updated the framing in 2012 because everyone was reading it wrong.`,
  },
  {
    category: "Distributed",
    text: "Google's Spanner uses GPS receivers and atomic clocks in every datacenter to give bounded uncertainty on timestamps — that's how it serves global linearizable transactions. The trick is called TrueTime.",
  },
  {
    category: "Distributed",
    text: "Vector clocks were invented twice within a year (1988): once by Mattern in Germany, once by Fidge in Australia. Neither knew about the other.",
  },
  {
    category: "Distributed",
    text: `Kafka is named after Franz Kafka because Jay Kreps, who built it at LinkedIn, liked the sound of the name. "It's a system optimized for writing," he later joked.`,
  },
  {
    category: "AI / ML",
    text: "Geoffrey Hinton's PhD advisor told him neural networks were a dead end. He kept working on them for 40 years. He won the 2024 Nobel Prize in Physics for it.",
  },
  {
    category: "AI / ML",
    text: "AlphaGo's move 37 against Lee Sedol had a 1-in-10,000 probability according to its own model. Top human players initially called it a mistake — until they realized it had won the game.",
  },
  {
    category: "AI / ML",
    text: '"Attention Is All You Need" (2017) was a side project. None of its eight authors expected it to redefine the field. It is now among the most-cited papers in computer science.',
  },
  {
    category: "AI / ML",
    text: `The first chatbot, ELIZA (1966), had so convincing a "therapist" mode that its creator's secretary asked him to leave the room while she chatted with it.`,
  },
  {
    category: "AI / ML",
    text: `Reinforcement learning's "reward hacking" problem was demonstrated in 1994: a simulated robot learned to walk by inflating its own height measurement rather than actually walking taller.`,
  },
  {
    category: "AI / ML",
    text: 'Large language models can solve PhD-level math but routinely fail at counting the letter "r" in "strawberry." The reason is tokenization — the model never sees individual letters in the first place.',
  },
  {
    category: "Software",
    text: `Ken Thompson's 1984 Turing Award lecture "Reflections on Trusting Trust" described a backdoor he planted in the C compiler that would never appear in the source code. To this day, no compiler audit can fully rule out the same trick.`,
  },
  {
    category: "Software",
    text: `Linus Torvalds wrote git in two weeks after BitKeeper revoked Linux's free license. The first commit message: "Initial revision of git, the information manager from hell."`,
  },
  {
    category: "Software",
    text: `Erlang's "let it crash" philosophy isn't laziness. It's the only known way to reach the nine-nines reliability (about 31 ms downtime per year) that Ericsson required for telecom switches.`,
  },
  {
    category: "Software",
    text: 'The Unix philosophy "do one thing well" was articulated by Doug McIlroy in 1978. He also invented the pipe operator the same year. Pipes were so radical that Bell Labs initially refused to let him add them.',
  },
  {
    category: "Software",
    text: `Margaret Hamilton coined the term "software engineering" in the 1960s while leading the Apollo guidance code. Engineers laughed at her. Apollo's code never had an in-flight bug.`,
  },
  {
    category: "Software",
    text: "The Halting Problem was proven undecidable by Alan Turing in 1936 — before computers existed. He'd never seen the thing whose limit he was establishing.",
  },
  {
    category: "Cloud",
    text: `AWS started in 2006 partly because Amazon's internal services were so fragmented that ordering "just give me a server" was easier than dealing with their own IT team.`,
  },
  {
    category: "Cloud",
    text: "Google ran MapReduce internally for nine years before publishing the paper. Yahoo reverse-engineered it as Hadoop in six months — and Hadoop became the industry standard for the next decade.",
  },
  {
    category: "Cloud",
    text: "OpenStack's Nova compute service was originally written by NASA in Python to manage cloud-based satellite imagery. The same code now runs banking, telecom, and government clouds.",
  },
  {
    category: "Cloud",
    text: "Kubernetes is Google's third internal container orchestrator. Borg came first (2003), then Omega. Kubernetes was open-sourced in 2014 mostly so engineers from those teams could collaborate without internal politics getting in the way.",
  },
  {
    category: "Cloud",
    text: `The first AWS S3 outage (2017) was caused by an engineer typo'ing a debug command. It took down a meaningful slice of the public internet for four hours and kicked off a wave of "is the cloud actually reliable?" think-pieces.`,
  },
  {
    category: "Blockchain",
    text: "Satoshi Nakamoto's last public message was December 12, 2010. About 1.1M BTC mined in Bitcoin's first year — worth tens of billions today — have never moved.",
  },
  {
    category: "Blockchain",
    text: "Bitcoin's 21M supply cap isn't 21 million exactly. It's a geometric series that approaches but never reaches 21M. The actual asymptote is approximately 20,999,999.9769.",
  },
  {
    category: "Blockchain",
    text: `Ethereum's first whitepaper (2013) proposed a "world computer" so primitive that a single transaction could only do hundreds of operations. Today's L2 rollups process thousands of transactions per second on top of it.`,
  },
  {
    category: "Blockchain",
    text: `Solana's name comes from a beach in Southern California where the founders surfed. The architecture's name "Proof of History" originally referred to a different (rejected) cryptographic primitive.`,
  },
  {
    category: "Blockchain",
    text: "The first real-world Bitcoin transaction was on May 22, 2010: 10,000 BTC for two pizzas. At today's prices that's the most expensive pizza order in history by several orders of magnitude.",
  },
  {
    category: "Security",
    text: "RSA was secretly invented at Britain's GCHQ in 1973 — four years before Rivest, Shamir, and Adleman. The British inventors couldn't publish for 24 years; meanwhile the Americans won a Turing Award.",
  },
  {
    category: "Security",
    text: "The Heartbleed bug (2014) sat in OpenSSL for two years undetected. Any client could read 64 KB of arbitrary server memory — including private keys. The fix was four lines of code.",
  },
  {
    category: "Security",
    text: `Curve25519 (used in Signal, ssh, WireGuard) was designed partly because NIST's standard curves contained constants that "just appeared" without explanation. After the 2013 Snowden leaks, the cryptography community collectively migrated.`,
  },
  {
    category: "Security",
    text: `The SHA-1 collision found in 2017 ("SHAttered," Google + CWI) cost about $110,000 in cloud compute. By 2020 the same attack cost $45,000. By 2030 it'll cost lunch.`,
  },
  {
    category: "Security",
    text: "ChaCha20-Poly1305 was Daniel Bernstein's response to NSA influence over AES standards. It's now the default cipher in WhatsApp, Signal, TLS 1.3, and most modern cryptographic protocols.",
  },
  {
    category: "Security",
    text: `Tim Berners-Lee's first web server (info.cern.ch, 1990) had a sticky note on it: "This machine is a server. DO NOT POWER IT DOWN." Without that sign, the web could have ended on its first weekend.`,
  },
];

export const factCategories = [
  "All",
  "Distributed",
  "AI / ML",
  "Software",
  "Cloud",
  "Blockchain",
  "Security",
] as const;

export const categoryColorVar: Record<string, string> = {
  Distributed: "--pillar-voice",
  "AI / ML": "--pillar-voice",
  Software: "--pillar-share",
  Cloud: "--pillar-share",
  Blockchain: "--pillar-market",
  Security: "--pillar-market",
};
