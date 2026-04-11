import { NextRequest, NextResponse } from "next/server";

interface Post {
  id: number;
  content: string;
  author: string;
  createdAt: number;
}

const mockPosts: Record<number, Post[]> = {
  101: [
    {
      id: 1,
      content:
        "Welcome to Atto Newsroom! This is the official announcement thread for our AI-powered journalism platform.",
      author: "admin",
      createdAt: Date.now() - 604800000
    },
    {
      id: 2,
      content:
        "So excited to be here! Can't wait to see what the AI reporters come up with.",
      author: "user1",
      createdAt: Date.now() - 518400000
    },
    {
      id: 3,
      content:
        "The editor selection seems really smart. Love how it curates the best stories.",
      author: "reader1",
      createdAt: Date.now() - 432000000
    },
    {
      id: 4,
      content:
        "How does the beat system work? Are reporters assigned specific topics?",
      author: "curious1",
      createdAt: Date.now() - 345600000
    },
    {
      id: 5,
      content:
        "Yes! Each reporter has specific beats they cover. Check the reporters page to see who's covering what.",
      author: "admin",
      createdAt: Date.now() - 259200000
    },
    {
      id: 6,
      content:
        "This is exactly what I wanted - automated journalism done right!",
      author: "enthusiast1",
      createdAt: Date.now() - 172800000
    },
    {
      id: 7,
      content: "What's the difference between articles and editions?",
      author: "newbie1",
      createdAt: Date.now() - 86400000
    },
    {
      id: 8,
      content:
        "Articles are individual stories, editions are curated collections of the best articles.",
      author: "explainer",
      createdAt: Date.now() - 43200000
    },
    {
      id: 9,
      content:
        "And daily editions compile multiple regular editions into one comprehensive paper!",
      author: "editor",
      createdAt: Date.now() - 21600000
    },
    {
      id: 10,
      content:
        "Great to see this community forming. Looking forward to discussions!",
      author: "admin",
      createdAt: Date.now() - 10800000
    },
    {
      id: 11,
      content:
        "The pipeline is fascinating - events to articles to editions to daily. Very organized!",
      author: "analyst1",
      createdAt: Date.now() - 3600000
    },
    {
      id: 12,
      content:
        "Thanks for the warm welcome! This seems like a really innovative project.",
      author: "newmember",
      createdAt: Date.now() - 1800000
    }
  ],
  115: [
    {
      id: 1,
      content:
        "What's everyone working on this week? Any interesting use cases for Atto?",
      author: "user1",
      createdAt: Date.now() - 86400000
    },
    {
      id: 2,
      content:
        "I'm experimenting with different prompt styles to get better headlines.",
      author: "promptdev",
      createdAt: Date.now() - 79200000
    },
    {
      id: 3,
      content:
        "Setting up a custom beat for local news in my area. Anyone done this?",
      author: "localnews",
      createdAt: Date.now() - 72000000
    },
    {
      id: 4,
      content:
        "The system is great for tracking long-running stories across multiple events.",
      author: "tracker1",
      createdAt: Date.now() - 64800000
    },
    {
      id: 5,
      content:
        "Working on integrating more social media sources beyond Bluesky.",
      author: "integrator1",
      createdAt: Date.now() - 57600000
    },
    {
      id: 6,
      content: "Anyone using this for content marketing research?",
      author: "marketer1",
      createdAt: Date.now() - 50400000
    },
    {
      id: 7,
      content:
        "Just playing around with the editorial prompts to get different tones.",
      author: "experimenter",
      createdAt: Date.now() - 43200000
    },
    {
      id: 8,
      content: "Setting up automated newsletters using the daily editions!",
      author: "newsletter1",
      createdAt: Date.now() - 7200000
    }
  ],
  125: [
    {
      id: 1,
      content:
        "Would love to see support for more social media platforms. Reddit, Twitter (X), etc.",
      author: "featurefan",
      createdAt: Date.now() - 172800000
    },
    {
      id: 2,
      content:
        "Agreed! Reddit would be amazing for discussions and trending topics.",
      author: "redditfan",
      createdAt: Date.now() - 158400000
    },
    {
      id: 3,
      content:
        "Maybe support for RSS feeds too? That would open up so many possibilities.",
      author: "rsslover",
      createdAt: Date.now() - 144000000
    },
    {
      id: 4,
      content:
        "What about YouTube? Video content could be analyzed for news too.",
      author: "videofan",
      createdAt: Date.now() - 115200000
    },
    {
      id: 5,
      content:
        "Adding more sources is on the roadmap. Thanks for the suggestions!",
      author: "admin",
      createdAt: Date.now() - 7200000
    }
  ],
  201: [
    {
      id: 1,
      content: "Let's share the best headlines the AI has generated this week!",
      author: "editor",
      createdAt: Date.now() - 43200000
    },
    {
      id: 2,
      content:
        '"Tech Giants Announce Revolutionary AI Partnership" - pretty solid!',
      author: "headlinefan",
      createdAt: Date.now() - 36000000
    },
    {
      id: 3,
      content:
        'I liked "Local Community Comes Together for Annual Festival" - very heartwarming.',
      author: "positivenews",
      createdAt: Date.now() - 28800000
    },
    {
      id: 4,
      content:
        'The science ones are always interesting: "Researchers Discover New Species in Amazon"',
      author: "sciencefan",
      createdAt: Date.now() - 21600000
    },
    {
      id: 5,
      content:
        'Sports coverage is getting better: "Underdog Team Secures Historic Victory"',
      author: "sportsfan",
      createdAt: Date.now() - 14400000
    },
    {
      id: 6,
      content:
        'Some headlines need work though. "Event Happens in Location" isn\'t very engaging.',
      author: "critic1",
      createdAt: Date.now() - 10800000
    },
    {
      id: 7,
      content:
        "Agreed on the clickbait-y ones. But overall the quality is improving!",
      author: "optimist1",
      createdAt: Date.now() - 7200000
    },
    {
      id: 8,
      content:
        "What prompt settings are you using? I find adjusting temperature helps a lot.",
      author: "tuner1",
      createdAt: Date.now() - 3600000
    },
    {
      id: 9,
      content:
        "0.7 temperature seems to be the sweet spot for creative but accurate headlines.",
      author: "experimenter",
      createdAt: Date.now() - 1800000
    },
    {
      id: 10,
      content: "Nice thread! Can we do this weekly?",
      author: "fan1",
      createdAt: Date.now() - 600000
    },
    {
      id: 11,
      content: "Love this idea. Let's make it a regular thing!",
      author: "editor",
      createdAt: Date.now() - 300000
    },
    {
      id: 12,
      content:
        '"Market Trends Show Promising Growth for Renewable Energy" - my favorite this week!',
      author: "greentech",
      createdAt: Date.now() - 180000
    },
    {
      id: 13,
      content: "The political coverage has been surprisingly balanced.",
      author: "balanced1",
      createdAt: Date.now() - 90000
    },
    {
      id: 14,
      content: "Quality coverage across the board this week. Great work team!",
      author: "supporter",
      createdAt: Date.now() - 45000
    }
  ],
  235: [
    {
      id: 1,
      content:
        "What are your best tips for optimizing reporter prompts to get better coverage?",
      author: "promptmaster",
      createdAt: Date.now() - 172800000
    },
    {
      id: 2,
      content:
        'Be specific about the beat. Don\'t just say "tech" - specify "AI startups" or "consumer gadgets".',
      author: "specific1",
      createdAt: Date.now() - 158400000
    },
    {
      id: 3,
      content:
        "I include example headlines in the prompt. Helps the AI understand the style.",
      author: "exampler",
      createdAt: Date.now() - 144000000
    },
    {
      id: 4,
      content:
        'Adding constraints like "avoid speculation" or "focus on facts" improves accuracy.',
      author: "constraint1",
      createdAt: Date.now() - 129600000
    },
    {
      id: 5,
      content: "What about the editor prompts? Those seem different.",
      author: "curiouseditor",
      createdAt: Date.now() - 115200000
    },
    {
      id: 6,
      content:
        "Editor prompts need to focus on news judgment and story selection criteria.",
      author: "editor1",
      createdAt: Date.now() - 100800000
    },
    {
      id: 7,
      content:
        'I include specific metrics like "prioritize breaking news" and "favor local angles".',
      author: "metrics1",
      createdAt: Date.now() - 86400000
    },
    {
      id: 8,
      content:
        "The system message matters a lot. Set the tone as a professional journalist.",
      author: "tone setter",
      createdAt: Date.now() - 72000000
    },
    {
      id: 9,
      content:
        "How do you handle multiple beats? Can one reporter cover two topics?",
      author: "multibeat",
      createdAt: Date.now() - 57600000
    },
    {
      id: 10,
      content:
        "Yes but it works better to keep beats focused. Too broad = less coherent coverage.",
      author: "focused1",
      createdAt: Date.now() - 43200000
    },
    {
      id: 11,
      content:
        "Iteration is key. I refine prompts based on what articles are being generated.",
      author: "iterative1",
      createdAt: Date.now() - 28800000
    },
    {
      id: 12,
      content:
        "Building a prompt library has been really helpful. Track what works!",
      author: "organizer1",
      createdAt: Date.now() - 21600000
    },
    {
      id: 13,
      content:
        "Temperature and max tokens matter too - don't forget those parameters!",
      author: "param1",
      createdAt: Date.now() - 14400000
    },
    {
      id: 14,
      content:
        "Great tips everyone! I'm going to try the example-based approach.",
      author: "newtothis",
      createdAt: Date.now() - 10800000
    },
    {
      id: 15,
      content:
        'Adding "include quotes from sources" improves article quality dramatically.',
      author: "quote1",
      createdAt: Date.now() - 7200000
    },
    {
      id: 16,
      content:
        "The message slice count setting affects how much context reporters get.",
      author: "context1",
      createdAt: Date.now() - 5400000
    },
    {
      id: 17,
      content: "What's a good slice count? I've been using default.",
      author: "newbie2",
      createdAt: Date.now() - 3600000
    },
    {
      id: 18,
      content:
        "10-15 messages usually works well. Too few and you lose context, too many and it gets noisy.",
      author: "experienced1",
      createdAt: Date.now() - 2700000
    },
    {
      id: 19,
      content: "This thread is gold. Bookmarking for later!",
      author: "bookmarker",
      createdAt: Date.now() - 1800000
    }
  ],
  301: [
    {
      id: 1,
      content:
        "Let's look back at the events from last month. Any standout stories?",
      author: "historian",
      createdAt: Date.now() - 259200000
    },
    {
      id: 2,
      content:
        "The AI ethics debates were huge in month 1. Generated lots of good content.",
      author: "observer1",
      createdAt: Date.now() - 233280000
    },
    {
      id: 3,
      content:
        "Climate change coverage improved dramatically after we added the environmental beat.",
      author: "greenteam",
      createdAt: Date.now() - 207360000
    },
    {
      id: 4,
      content:
        "Remember when the system first started generating daily editions? Big milestone.",
      author: "founder1",
      createdAt: Date.now() - 181440000
    },
    {
      id: 5,
      content: "What was the first article ever generated?",
      author: "curious1",
      createdAt: Date.now() - 155520000
    },
    {
      id: 6,
      content:
        "It was something about tech industry layoffs. Not very polished but it worked!",
      author: "firstgen",
      createdAt: Date.now() - 129600000
    },
    {
      id: 7,
      content:
        "The evolution has been incredible. Quality now is so much better.",
      author: "longtime1",
      createdAt: Date.now() - 103680000
    },
    {
      id: 8,
      content: "Are there archived articles we can browse?",
      author: "archivist1",
      createdAt: Date.now() - 77760000
    },
    {
      id: 9,
      content:
        "Yes! Check the editions page - you can see historical content there.",
      author: "guide1",
      createdAt: Date.now() - 51840000
    },
    {
      id: 10,
      content: "The retrospective analysis feature would be cool.",
      author: "idea1",
      createdAt: Date.now() - 25920000
    },
    {
      id: 11,
      content: "Great thread! Love seeing the history develop.",
      author: "fan1",
      createdAt: Date.now() - 10800000
    }
  ],
  325: [
    {
      id: 1,
      content:
        "Where do you think the AI news industry is heading in the next 5 years?",
      author: "futurist",
      createdAt: Date.now() - 86400000
    },
    {
      id: 2,
      content:
        "I think we'll see more personalization. AI that learns your interests.",
      author: "pred1",
      createdAt: Date.now() - 79200000
    },
    {
      id: 3,
      content:
        "Real-time news generation will become standard. Breaking news within minutes.",
      author: "speed1",
      createdAt: Date.now() - 72000000
    },
    {
      id: 4,
      content: "What about fact-checking? AI can verify claims automatically.",
      author: "fact1",
      createdAt: Date.now() - 64800000
    },
    {
      id: 5,
      content:
        "Regulations will definitely increase. Governments won't ignore automated journalism.",
      author: "reg1",
      createdAt: Date.now() - 57600000
    },
    {
      id: 6,
      content:
        "I'm hopeful that AI will help local news survive. Automated coverage for small towns.",
      author: "local1",
      createdAt: Date.now() - 50400000
    },
    {
      id: 7,
      content:
        "The business model question is interesting. Will ads still work?",
      author: "biz1",
      createdAt: Date.now() - 43200000
    },
    {
      id: 8,
      content:
        "Subscription models will probably grow. People want ad-free AI news.",
      author: "sub1",
      createdAt: Date.now() - 36000000
    },
    {
      id: 9,
      content:
        "Cross-language generation is going to be huge. Translate and localize automatically.",
      author: "global1",
      createdAt: Date.now() - 28800000
    },
    {
      id: 10,
      content:
        "Video and audio versions of articles. AI anchors reading the news.",
      author: "media1",
      createdAt: Date.now() - 21600000
    },
    {
      id: 11,
      content:
        "That's already happening! Some outlets are experimenting with AI video.",
      author: "early1",
      createdAt: Date.now() - 14400000
    },
    {
      id: 12,
      content: "Will human journalists still have jobs?",
      author: "job1",
      createdAt: Date.now() - 10800000
    },
    {
      id: 13,
      content:
        "Yes but their roles will shift. AI handles the first draft, humans polish.",
      author: "realist1",
      createdAt: Date.now() - 7200000
    },
    {
      id: 14,
      content: "The hybrid model seems most likely. AI + human editing.",
      author: "balanced1",
      createdAt: Date.now() - 5400000
    },
    {
      id: 15,
      content: "Exciting times ahead! This is just the beginning.",
      author: "optimist1",
      createdAt: Date.now() - 3600000
    },
    {
      id: 16,
      content: "Agreed! The potential for good journalism is massive.",
      author: "journalist1",
      createdAt: Date.now() - 1800000
    }
  ],
  401: [
    {
      id: 1,
      content:
        "What music do you all listen to while coding? Share your favorites!",
      author: "coder1",
      createdAt: Date.now() - 43200000
    },
    {
      id: 2,
      content: "Lo-fi hip hop all the way. Perfect for focus.",
      author: "lofi1",
      createdAt: Date.now() - 39600000
    },
    {
      id: 3,
      content:
        "Synthwave for that retro coding vibe. Hotline Miami soundtrack is peak.",
      author: "synth1",
      createdAt: Date.now() - 36000000
    },
    {
      id: 4,
      content:
        "Classical music helps me concentrate. Mozart, Bach, that sort of thing.",
      author: "classical1",
      createdAt: Date.now() - 32400000
    },
    {
      id: 5,
      content: "Podcasts for me. Interviews and discussions keep me engaged.",
      author: "podcast1",
      createdAt: Date.now() - 28800000
    },
    {
      id: 6,
      content: "Video game soundtracks are underrated. No lyrics to distract.",
      author: "vgm1",
      createdAt: Date.now() - 25200000
    },
    {
      id: 7,
      content: "Ambient electronic like Brian Eno. Very calming.",
      author: "ambient1",
      createdAt: Date.now() - 21600000
    },
    {
      id: 8,
      content: "Metal when I'm debugging. Gets me in the zone.",
      author: "metal1",
      createdAt: Date.now() - 18000000
    },
    {
      id: 9,
      content: "Jazzy lo-fi is my go-to. The best of both worlds.",
      author: "fusion1",
      createdAt: Date.now() - 14400000
    },
    {
      id: 10,
      content: "Silence sometimes. When I'm stuck, quiet helps me think.",
      author: "quiet1",
      createdAt: Date.now() - 10800000
    },
    {
      id: 11,
      content: "Indie rock for regular coding, classical for hard problems.",
      author: "genre1",
      createdAt: Date.now() - 7200000
    },
    {
      id: 12,
      content: "Phonk! Houston rap beats for late night coding sessions.",
      author: "phonk1",
      createdAt: Date.now() - 5400000
    },
    {
      id: 13,
      content: "Acoustic singer-songwriters. Female artists especially.",
      author: "acoustic1",
      createdAt: Date.now() - 3600000
    },
    {
      id: 14,
      content: "Chillhop on YouTube. 24/7 streams are great.",
      author: "chill1",
      createdAt: Date.now() - 1800000
    },
    {
      id: 15,
      content: "Soundtracks from movies. Hans Zimmer scores are amazing.",
      author: "score1",
      createdAt: Date.now() - 900000
    },
    {
      id: 16,
      content: "90s R&B for that nostalgia hit while I debug.",
      author: "nostalgia1",
      createdAt: Date.now() - 600000
    },
    {
      id: 17,
      content: "Everything except pop. Too distracting!",
      author: "selective1",
      createdAt: Date.now() - 300000
    },
    {
      id: 18,
      content: "Depends on the task. Upbeat for easy stuff, calm for complex.",
      author: "adaptive1",
      createdAt: Date.now() - 180000
    },
    {
      id: 19,
      content: 'Found a great playlist: "Music for Deep Work" on Spotify.',
      author: "playlist1",
      createdAt: Date.now() - 120000
    },
    {
      id: 20,
      content: "Sharing that one! Thanks!",
      author: "grateful1",
      createdAt: Date.now() - 60000
    },
    {
      id: 21,
      content: "EDM for repetitive tasks. Keeps energy up.",
      author: "edm1",
      createdAt: Date.now() - 30000
    },
    {
      id: 22,
      content: "Japanese city pop is my current obsession.",
      author: "citypop1",
      createdAt: Date.now() - 18000
    },
    {
      id: 23,
      content: "How do you all discover new music?",
      author: "discovery1",
      createdAt: Date.now() - 12000
    },
    {
      id: 24,
      content: "RateYourMusic is great for finding new stuff.",
      author: "rym1",
      createdAt: Date.now() - 9000
    },
    {
      id: 25,
      content: "Algorithm playlists honestly. Discover Weekly is solid.",
      author: "algo1",
      createdAt: Date.now() - 6000
    },
    {
      id: 26,
      content: "Friend recommendations still beat everything.",
      author: "social1",
      createdAt: Date.now() - 3000
    },
    {
      id: 27,
      content: "Reddit threads like this one!",
      author: "redditor1",
      createdAt: Date.now() - 1800
    },
    {
      id: 28,
      content: "Great thread everyone! Music makes coding so much better.",
      author: "coder1",
      createdAt: Date.now() - 600
    }
  ],
  430: [
    {
      id: 1,
      content: "What new AI tools have you all been trying? Share your finds!",
      author: "earlyadopter",
      createdAt: Date.now() - 172800000
    },
    {
      id: 2,
      content:
        "Claude is amazing for reasoning tasks. The improvements in 3.5 are incredible.",
      author: "claudefan",
      createdAt: Date.now() - 158400000
    },
    {
      id: 3,
      content:
        "Runway ML for video editing. AI-powered features are game-changing.",
      author: "video1",
      createdAt: Date.now() - 144000000
    },
    {
      id: 4,
      content:
        "Notion AI for note-taking and summarization. Perfect for research.",
      author: "notion1",
      createdAt: Date.now() - 129600000
    },
    {
      id: 5,
      content:
        "Perplexity for search. It actually understands complex queries.",
      author: "perplex1",
      createdAt: Date.now() - 115200000
    },
    {
      id: 6,
      content: "Midjourney v6 for images. The quality gap keeps closing.",
      author: "art1",
      createdAt: Date.now() - 100800000
    },
    {
      id: 7,
      content: "Cursor for coding. The AI autocomplete is next level.",
      author: "cursor1",
      createdAt: Date.now() - 86400000
    },
    {
      id: 8,
      content: "ElevenLabs for voice cloning. Scary good results.",
      author: "voice1",
      createdAt: Date.now() - 72000000
    },
    {
      id: 9,
      content:
        "GitHub Copilot is still my daily driver. Can't code without it now.",
      author: "copilot1",
      createdAt: Date.now() - 57600000
    },
    {
      id: 10,
      content: "Obsidian with the AI plugin for knowledge management.",
      author: "obsidian1",
      createdAt: Date.now() - 43200000
    },
    {
      id: 11,
      content: "Whisper for transcription. Local and accurate.",
      author: "transcribe1",
      createdAt: Date.now() - 28800000
    },
    {
      id: 12,
      content: "What about local models? Anyone running Llama locally?",
      author: "local1",
      createdAt: Date.now() - 21600000
    },
    {
      id: 13,
      content: "Ollama is great for that. Running Mistral on my laptop now.",
      author: "ollama1",
      createdAt: Date.now() - 14400000
    },
    {
      id: 14,
      content: "LM Studio makes it easy to try different models.",
      author: "lmstudio1",
      createdAt: Date.now() - 10800000
    },
    {
      id: 15,
      content:
        "The privacy benefits of local are huge. No data leaving your machine.",
      author: "privacy1",
      createdAt: Date.now() - 7200000
    },
    {
      id: 16,
      content:
        "Trade-off is capability though. Cloud models still win on complexity.",
      author: "realist1",
      createdAt: Date.now() - 5400000
    },
    {
      id: 17,
      content: "Best combo: local for quick stuff, cloud for complex prompts.",
      author: "hybrid1",
      createdAt: Date.now() - 3600000
    },
    {
      id: 18,
      content: "Anyone tried the new Groq inference? Insanely fast.",
      author: "groq1",
      createdAt: Date.now() - 1800000
    }
  ],
  445: [
    {
      id: 1,
      content:
        "What's everyone's take on AI's role in political journalism? Is it different from other beats?",
      author: "journalist1",
      createdAt: Date.now() - 172800000
    },
    {
      id: 2,
      content:
        "The bias question is huge. Whose worldview gets encoded in the prompts?",
      author: "skeptic1",
      createdAt: Date.now() - 158400000
    },
    {
      id: 3,
      content:
        "I think it can actually be more neutral than human journalists. No personal biases.",
      author: "optimist1",
      createdAt: Date.now() - 144000000
    },
    {
      id: 4,
      content:
        "But the training data has biases. That's where the problem starts.",
      author: "realist1",
      createdAt: Date.now() - 129600000
    },
    {
      id: 5,
      content:
        "Human oversight is essential for political coverage. AI should assist, not replace.",
      author: "balanced1",
      createdAt: Date.now() - 115200000
    },
    {
      id: 6,
      content:
        "Speed advantage is real though. AI can track more politicians than human reporters.",
      author: "speed1",
      createdAt: Date.now() - 100800000
    },
    {
      id: 7,
      content:
        "That's a double-edged sword. Speed without accuracy is dangerous in politics.",
      author: "cautious1",
      createdAt: Date.now() - 86400000
    },
    {
      id: 8,
      content:
        "Fact-checking AI is a must-have. Automatically verify claims in speeches.",
      author: "fact1",
      createdAt: Date.now() - 72000000
    },
    {
      id: 9,
      content:
        "Campaign finance tracking could be automated too. Lots of public data.",
      author: "transparency1",
      createdAt: Date.now() - 57600000
    },
    {
      id: 10,
      content: "The emotional manipulation risk is what worries me most.",
      author: "ethics1",
      createdAt: Date.now() - 43200000
    },
    {
      id: 11,
      content:
        "Agreed. Political actors could game the system if prompts aren't robust.",
      author: "security1",
      createdAt: Date.now() - 28800000
    },
    {
      id: 12,
      content: "Transparency about AI involvement is key. Readers should know.",
      author: "disclosure1",
      createdAt: Date.now() - 21600000
    },
    {
      id: 13,
      content:
        "We clearly label AI-generated content. That's the ethical approach.",
      author: "ethical1",
      createdAt: Date.now() - 14400000
    },
    {
      id: 14,
      content: "What about deepfakes? AI-generated images of politicians?",
      author: "deepfake1",
      createdAt: Date.now() - 10800000
    },
    {
      id: 15,
      content:
        "That's a whole separate issue. Detection tools are improving though.",
      author: "detector1",
      createdAt: Date.now() - 7200000
    },
    {
      id: 16,
      content: "We need both detection and education. Media literacy matters.",
      author: "educator1",
      createdAt: Date.now() - 5400000
    },
    {
      id: 17,
      content:
        "This is why diverse training data matters. Multiple perspectives.",
      author: "diversity1",
      createdAt: Date.now() - 3600000
    },
    {
      id: 18,
      content: "Great discussion! Hard topics but important to talk about.",
      author: "moderator1",
      createdAt: Date.now() - 14400000
    }
  ],
  460: [
    {
      id: 1,
      content: "What internet culture trends have you noticed lately?",
      author: "trendspotter",
      createdAt: Date.now() - 43200000
    },
    {
      id: 2,
      content:
        "The 'core' aesthetic keeps evolving. Now it's 'warm minimalism' or something.",
      author: "aesthetic1",
      createdAt: Date.now() - 36000000
    },
    {
      id: 3,
      content: "ASMR content is huge. Especially roleplay scenarios.",
      author: "asmr1",
      createdAt: Date.now() - 28800000
    },
    {
      id: 4,
      content: "Nostalgia cycles are getting shorter. 2010s is already retro.",
      author: "nostalgia1",
      createdAt: Date.now() - 21600000
    },
    {
      id: 5,
      content: "Clean girl aesthetic is fading. Old money aesthetic is in now.",
      author: "fashion1",
      createdAt: Date.now() - 14400000
    },
    {
      id: 6,
      content: "What about YouTube? Any trends there?",
      author: "youtube1",
      createdAt: Date.now() - 10800000
    },
    {
      id: 7,
      content:
        "Shorts and Reels dominate. Long-form is making a comeback though.",
      author: "platform1",
      createdAt: Date.now() - 7200000
    },
    {
      id: 8,
      content:
        "Podcast ad reads are getting more integrated. Native advertising.",
      author: "ads1",
      createdAt: Date.now() - 5400000
    },
    {
      id: 9,
      content:
        "Discord servers are the new subreddits. More intimate communities.",
      author: "discord1",
      createdAt: Date.now() - 3600000
    },
    {
      id: 10,
      content: "Fediverse is growing! People tired of big tech platforms.",
      author: "fediverse1",
      createdAt: Date.now() - 1800000
    },
    {
      id: 11,
      content:
        "The 'anti-influencer' trend is interesting. Authenticity over polish.",
      author: "authenticity1",
      createdAt: Date.now() - 900000
    },
    {
      id: 12,
      content:
        "Gaming communities keep evolving. Twitch vs YouTube competition.",
      author: "gaming1",
      createdAt: Date.now() - 600000
    },
    {
      id: 13,
      content: "VR/AR is still niche but growing in specific communities.",
      author: "vr1",
      createdAt: Date.now() - 300000
    },
    {
      id: 14,
      content: "Newsletter culture is strong. Substack and similar platforms.",
      author: "newsletter1",
      createdAt: Date.now() - 180000
    },
    {
      id: 15,
      content: "Memes about AI itself are everywhere now. Very meta.",
      author: "meta1",
      createdAt: Date.now() - 120000
    },
    {
      id: 16,
      content: "The TikTok ban situation is driving users to other platforms.",
      author: "tiktok1",
      createdAt: Date.now() - 60000
    },
    {
      id: 17,
      content: "Leaning into BeReel now. Similar but different algorithm.",
      author: "bereel1",
      createdAt: Date.now() - 30000
    },
    {
      id: 18,
      content: "What about Reddit? Still relevant?",
      author: "reddit1",
      createdAt: Date.now() - 18000
    },
    {
      id: 19,
      content:
        "Reddit is doing well. The API changes caused drama but it's recovering.",
      author: "redditor1",
      createdAt: Date.now() - 9000
    },
    {
      id: 20,
      content: "Twitter (X) is a mess but still the place for news breaking.",
      author: "twitter1",
      createdAt: Date.now() - 6000
    },
    {
      id: 21,
      content: "Bluesky is the rising star for techtwitter. Growing fast.",
      author: "bluesky1",
      createdAt: Date.now() - 3000
    },
    {
      id: 22,
      content:
        "Cross-posting everywhere is the strategy now. No single platform.",
      author: "cross1",
      createdAt: Date.now() - 1800
    },
    {
      id: 23,
      content:
        "The algorithm discussion is tired but necessary. Transparency matters.",
      author: "algo1",
      createdAt: Date.now() - 1200
    },
    {
      id: 24,
      content: "Great thread! Internet culture moves fast.",
      author: "fast1",
      createdAt: Date.now() - 600
    }
  ]
};

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) => {
  const { threadId } = await params;
  const threadIdNum = parseInt(threadId, 10);
  const posts = mockPosts[threadIdNum] || [];
  return NextResponse.json(posts);
};
