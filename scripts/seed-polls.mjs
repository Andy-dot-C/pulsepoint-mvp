import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function parseEnvFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const entries = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const idx = line.indexOf("=");
      return [line.slice(0, idx), line.slice(idx + 1)];
    });

  return Object.fromEntries(entries);
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sample(list) {
  return list[randomInt(0, list.length - 1)];
}

function shuffle(input) {
  const copy = [...input];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function chunk(input, size) {
  const batches = [];
  for (let index = 0; index < input.length; index += size) {
    batches.push(input.slice(index, index + size));
  }
  return batches;
}

function toHumanOptionList(options) {
  if (!options || options.length === 0) return "";
  if (options.length === 1) return options[0];
  if (options.length === 2) return `${options[0]} and ${options[1]}`;
  return `${options.slice(0, -1).join(", ")}, and ${options[options.length - 1]}`;
}

function buildDetailDescription(poll) {
  const base = poll.description?.trim() ?? "";
  const optionContext = toHumanOptionList(poll.options);
  const optionLine = optionContext ? ` Current options in this poll are ${optionContext}.` : "";
  return `${base}${optionLine}`.trim();
}

function buildVoteDistribution(optionCount, totalVotes, bias = []) {
  const weights = Array.from({ length: optionCount }, (_, index) => Math.max(0.18, bias[index] ?? Math.random() + 0.25));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const counts = weights.map((weight) => Math.floor((weight / weightSum) * totalVotes));
  let assigned = counts.reduce((sum, value) => sum + value, 0);

  while (assigned < totalVotes) {
    counts[randomInt(0, optionCount - 1)] += 1;
    assigned += 1;
  }

  return counts;
}

function buildPercentBias(percentages) {
  return percentages.map((value) => Math.max(0.18, value / 100));
}

function weightedTimestamp(daysAgoRange, bucketWeight) {
  const [minDaysAgo, maxDaysAgo] = daysAgoRange;
  const dayOffset = minDaysAgo + Math.random() * (maxDaysAgo - minDaysAgo);
  const timeOfDay = randomInt(7, 23) * 60 + randomInt(0, 59);
  const timestamp = Date.now() - dayOffset * 24 * 60 * 60 * 1000;
  const snapped = new Date(timestamp);
  snapped.setUTCHours(0, 0, 0, 0);
  snapped.setUTCMinutes(timeOfDay);
  snapped.setUTCSeconds(randomInt(0, 59));
  snapped.setUTCMilliseconds(bucketWeight);
  return snapped.toISOString();
}

function generateActivityTimestamps(count, profile = "steady") {
  const profiles = {
    surging: [
      { range: [0, 2], weight: 38 },
      { range: [3, 7], weight: 30 },
      { range: [8, 21], weight: 20 },
      { range: [22, 42], weight: 12 }
    ],
    steady: [
      { range: [0, 7], weight: 24 },
      { range: [8, 21], weight: 38 },
      { range: [22, 42], weight: 38 }
    ],
    cooling: [
      { range: [0, 3], weight: 10 },
      { range: [4, 10], weight: 18 },
      { range: [11, 24], weight: 32 },
      { range: [25, 42], weight: 40 }
    ],
    event: [
      { range: [0, 1], weight: 24 },
      { range: [5, 7], weight: 30 },
      { range: [12, 16], weight: 24 },
      { range: [28, 40], weight: 22 }
    ]
  };

  const buckets = profiles[profile] ?? profiles.steady;
  const totalWeight = buckets.reduce((sum, bucket) => sum + bucket.weight, 0);
  const timestamps = [];

  for (let index = 0; index < count; index += 1) {
    const draw = Math.random() * totalWeight;
    let cursor = 0;
    let selected = buckets[buckets.length - 1];

    for (const bucket of buckets) {
      cursor += bucket.weight;
      if (draw <= cursor) {
        selected = bucket;
        break;
      }
    }

    timestamps.push(weightedTimestamp(selected.range, index % 1000));
  }

  return timestamps.sort((left, right) => Date.parse(left) - Date.parse(right));
}

function buildCommentBodies(poll, count) {
  const options = poll.options;
  const isYesNo =
    options.length === 2 &&
    options.some((opt) => opt.trim().toLowerCase() === "yes") &&
    options.some((opt) => opt.trim().toLowerCase() === "no");

  const starters = [
    "Honestly",
    "For me",
    "Personally",
    "I think",
    "Not sure",
    "Hot take",
    "Fair point",
    "Maybe"
  ];

  const reasons = [
    "it just feels more practical",
    "that would be better long term",
    "people are overthinking this one",
    "most people I know would agree",
    "it depends on how it is implemented",
    "the current setup clearly is not working",
    "I can see both sides on this",
    "this will probably keep changing over time"
  ];

  const yesNoLines = [
    "Yes for me, this would be better.",
    "No, I think this would cause more problems.",
    "I voted yes because it feels fairer.",
    "I went no, not convinced this helps.",
    "Leaning yes but only if it is done properly.",
    "Leaning no, feels risky in practice.",
    "I changed my mind to yes after thinking about it.",
    "Still no for me."
  ];

  const optionLines = options.flatMap((option) => [
    `I picked ${option}.`,
    `${option} seems the strongest option right now.`,
    `Surprised ${option} is not higher.`,
    `I can see why people are backing ${option}.`,
    `Not convinced by ${option}, but I get the argument.`
  ]);

  return Array.from({ length: count }, (_, index) => {
    if (isYesNo) {
      const base = yesNoLines[index % yesNoLines.length];
      if (index % 3 === 0) return base;
      return `${sample(starters)}, ${base.charAt(0).toLowerCase()}${base.slice(1)} ${sample(reasons)}.`;
    }

    const base = optionLines[index % optionLines.length];
    if (index % 3 === 0) return base;
    if (index % 3 === 1) return `${sample(starters)}, ${base.charAt(0).toLowerCase()}${base.slice(1)} ${sample(reasons)}.`;
    return `${base} ${sample(reasons)}.`;
  });
}

const demoPolls = [
  {
    title: "Should the UK lower the voting age to 16?",
    blurb: "A high-engagement Westminster debate that plays well with both politics and youth audiences.",
    description:
      "This tracks whether people think voting age reform would modernise democracy or create more political noise without real participation gains.",
    category_key: "politics",
    options: ["Yes", "No"],
    biasPercentages: [57, 43],
    createdDaysAgo: 16,
    endDays: 18,
    voteRange: [1800, 2600],
    activityProfile: "surging",
    commentSeeds: [
      "If 16-year-olds can work and pay tax, they should have a vote.",
      "Schools would need much better civic education for this to work well.",
      "This would become one of the most-shared politics polls on the app.",
      "I think turnout would be lower than people assume at first.",
      "This is exactly the kind of issue where opinion shifts once campaign season starts.",
      "The split between principle and practicality is what makes this interesting."
    ]
  },
  {
    title: "Should the Bank of England cut rates this spring?",
    blurb: "A timely macro poll that feels credible for investors and business audiences.",
    description:
      "With markets watching inflation, growth, and household pressure, this poll tracks whether sentiment has moved toward a spring rate cut.",
    category_key: "politics",
    options: ["Cut rates", "Hold steady", "Raise again"],
    biasPercentages: [49, 42, 9],
    createdDaysAgo: 10,
    endDays: 12,
    voteRange: [1450, 2200],
    activityProfile: "event",
    commentSeeds: [
      "A cut would be popular, but the Bank will still be terrified of sticky inflation.",
      "This is one where market expectations and public expectations are miles apart.",
      "I can see a hold now and a cut later rather than an immediate move.",
      "If unemployment keeps softening, this will swing even harder toward a cut.",
      "This is a great poll because investors and normal voters read it very differently.",
      "Feels like exactly the kind of topic advertisers and media partners would want."
    ]
  },
  {
    title: "Who would you vote for if a UK general election were held tomorrow?",
    blurb: "A high-frequency benchmark poll for the homepage and any investor demo.",
    description:
      "A broad snapshot of immediate voting intention built for repeat visits, social sharing, and trend comparisons over time.",
    category_key: "politics",
    options: ["Labour", "Conservative", "Reform UK", "Liberal Democrats", "Green"],
    biasPercentages: [31, 22, 24, 13, 10],
    createdDaysAgo: 6,
    endDays: 9,
    voteRange: [2600, 3800],
    activityProfile: "surging",
    commentSeeds: [
      "This is the kind of flagship politics poll the site should own.",
      "Reform being competitive changes the entire shape of this question.",
      "Labour still being ahead here feels important even if enthusiasm is mixed.",
      "I would check this one every day if the trend line kept updating.",
      "The interesting story is whether tactical voting squeezes the smaller parties.",
      "This is the most investor-friendly poll on the homepage because everyone understands it instantly."
    ]
  },
  {
    title: "Should AI-generated political ads be clearly labelled by law?",
    blurb: "Election integrity plus AI regulation is a strong current topic and easy investor demo.",
    description:
      "Measures whether people think clear labelling is enough, whether paid political uses need tighter rules, or whether the market can self-correct.",
    category_key: "politics",
    options: ["Yes, all political AI content", "Only paid political ads", "No new law needed"],
    biasPercentages: [54, 31, 15],
    createdDaysAgo: 12,
    endDays: 20,
    voteRange: [1300, 2100],
    activityProfile: "steady",
    commentSeeds: [
      "This feels like one of those issues where public opinion moves fast once people see real examples.",
      "At minimum, paid ads should be labelled because that is where abuse becomes scalable.",
      "I’m not convinced lawmakers can define this cleanly enough.",
      "This topic makes the site feel modern rather than just another polling app.",
      "The hardest part is enforcing the rule once content starts getting remixed.",
      "I could see journalists embedding this poll inside stories very easily."
    ]
  },
  {
    title: "Should major constitutional reforms require a national referendum?",
    blurb: "A classic legitimacy question that works well with UK politics audiences.",
    description:
      "This measures whether parliamentary majorities alone should be enough for large constitutional change or whether direct public sign-off is needed.",
    category_key: "politics",
    options: ["Yes, always", "Only for the biggest reforms", "No, Parliament is enough"],
    biasPercentages: [34, 43, 23],
    createdDaysAgo: 19,
    endDays: 25,
    voteRange: [900, 1550],
    activityProfile: "cooling",
    commentSeeds: [
      "People say yes in principle until the referendum becomes about their least-favourite topic.",
      "This is probably the cleanest constitutional trust question on the site.",
      "I lean case-by-case because otherwise everything becomes a campaign.",
      "The real divide here is trust in Parliament versus trust in direct votes.",
      "This is a strong poll because there isn’t an obviously safe answer.",
      "You can imagine this one running for months and still getting engagement."
    ]
  },
  {
    title: "Should UK commuter rail be fully renationalised?",
    blurb: "Transport, cost of living, and public service quality all in one poll.",
    description:
      "Captures whether people think public control would improve price and reliability, or whether the problem is operational rather than ownership-based.",
    category_key: "hot-takes",
    options: ["Yes", "No"],
    biasPercentages: [63, 37],
    createdDaysAgo: 21,
    endDays: 17,
    voteRange: [1400, 2300],
    activityProfile: "steady",
    commentSeeds: [
      "This always overperforms because everyone has a rail horror story.",
      "I suspect support drops a bit once people hear the bill for it.",
      "Service quality is the real issue, but ownership is the easiest proxy question.",
      "This is one of the most relatable UK policy polls you can have.",
      "Any commuter glancing at the homepage instantly understands why this is here.",
      "The comments on this one should be chaos in a good way."
    ]
  },
  {
    title: "Should live VAR audio be broadcast during Premier League matches?",
    blurb: "Football transparency is easy to understand and highly shareable.",
    description:
      "This poll tracks whether supporters think live referee audio would improve trust or just create more scrutiny and theatre.",
    category_key: "sport",
    options: ["Yes", "No"],
    biasPercentages: [68, 32],
    createdDaysAgo: 8,
    endDays: 14,
    voteRange: [2200, 3300],
    activityProfile: "surging",
    commentSeeds: [
      "Every football fan would instantly know what this is about.",
      "If they aired it, people would complain for two weeks and then never want to go back.",
      "Part of the drama is exactly why the audio should be public.",
      "This one should sit very high on the homepage because it reads well at a glance.",
      "You could probably embed this into every football newsletter in the country.",
      "I think clubs would resist it but supporters would absolutely vote yes."
    ]
  },
  {
    title: "Who will win the 2026 Champions League?",
    blurb: "A premium sports poll that works especially well with visible trend changes over time.",
    description:
      "Tracks current confidence in Europe’s top clubs and shows momentum shifts as knockout rounds, injuries, and draw paths reshape sentiment.",
    category_key: "sport",
    options: ["Arsenal", "Real Madrid", "Bayern Munich", "Paris Saint-Germain", "Inter"],
    biasPercentages: [21, 28, 18, 20, 13],
    createdDaysAgo: 7,
    endDays: 26,
    voteRange: [1900, 3100],
    activityProfile: "event",
    commentSeeds: [
      "This is exactly the sort of sports poll that feels alive when the graph moves.",
      "Madrid still being feared no matter what is basically a law of football.",
      "Arsenal polls incredibly well online, which makes this useful for demo purposes.",
      "This kind of question is why showing only the top two options on cards works.",
      "If PSG start rolling people, this line would move a lot in a week.",
      "This is the sort of poll casual users can answer without reading any extra context."
    ]
  },
  {
    title: "Who will finish as the Premier League top scorer?",
    blurb: "Recognisable names make this a clean, glanceable poll card.",
    description:
      "Measures fan confidence around form, fixtures, and penalties to show how goal-scoring sentiment evolves across the run-in.",
    category_key: "sport",
    options: ["Erling Haaland", "Alexander Isak", "Mohamed Salah", "Cole Palmer", "Ollie Watkins"],
    biasPercentages: [33, 24, 21, 12, 10],
    createdDaysAgo: 11,
    endDays: 15,
    voteRange: [1500, 2600],
    activityProfile: "surging",
    commentSeeds: [
      "This is one where the percentages will move every weekend, which is perfect for the demo.",
      "A hat-trick changes the whole conversation overnight on a poll like this.",
      "Salah always polls strongly because people trust the consistency.",
      "If Isak stays fit, that line could keep climbing.",
      "I like this because the answer options are famous enough to feel premium immediately.",
      "Sports fans would absolutely come back to check this one after each round."
    ]
  },
  {
    title: "Should Formula 1 keep sprint weekends at the current level?",
    blurb: "A clean fan-governance poll that broadens the sports category beyond football.",
    description:
      "Tracks whether fans think sprint weekends add value or dilute the main event and strategic rhythm of the championship calendar.",
    category_key: "sport",
    options: ["Keep current number", "Add more", "Reduce them"],
    biasPercentages: [27, 16, 57],
    createdDaysAgo: 14,
    endDays: 22,
    voteRange: [850, 1400],
    activityProfile: "steady",
    commentSeeds: [
      "F1 fans can argue about this forever, which is exactly what we want.",
      "Sprint weekends are one of those products everyone debates but few people feel neutral on.",
      "The real question is whether they help new fans more than they annoy existing ones.",
      "This is a good non-football sports poll because it still feels mainstream.",
      "I’d expect this one to spike around each sprint weekend.",
      "You can tell a lot about fan fatigue from the comments on this."
    ]
  },
  {
    title: "Should the Oscars add a Best Stunt Design category?",
    blurb: "Widely understandable, easy to vote on, and consistently engaging.",
    description:
      "Measures whether audiences think a stunt category would better reflect modern filmmaking craft and reward a long-overlooked part of production.",
    category_key: "entertainment",
    options: ["Yes", "No"],
    biasPercentages: [74, 26],
    createdDaysAgo: 5,
    endDays: 16,
    voteRange: [1700, 2500],
    activityProfile: "surging",
    commentSeeds: [
      "This is a near-perfect entertainment poll because almost everyone immediately has an opinion.",
      "The public is miles ahead of awards bodies on categories like this.",
      "If you want a homepage poll that feels energetic, this is one of them.",
      "I’d expect this to get shared heavily any time an action movie trends.",
      "It also gives the entertainment category something broader than just fandom wars.",
      "Feels like the kind of yes-no card that will look great visually too."
    ]
  },
  {
    title: "Which 2026 film release are you most excited for right now?",
    blurb: "A useful culture signal poll with broad appeal and clean answer choices.",
    description:
      "Captures early audience excitement and helps show how entertainment anticipation can build over time before release dates arrive.",
    category_key: "entertainment",
    options: ["Project Hail Mary", "Marty Supreme", "One Battle After Another", "Shrek 5", "The Odyssey"],
    biasPercentages: [24, 14, 16, 18, 28],
    createdDaysAgo: 9,
    endDays: 28,
    voteRange: [1250, 2100],
    activityProfile: "event",
    commentSeeds: [
      "These are the kinds of answer options that make a poll card feel colourful without changing the design.",
      "You can almost see how trailers and casting news would move this over time.",
      "A hype poll like this is ideal for showing comments and sharing behavior.",
      "I’d expect this to be much closer once full trailers are out.",
      "Entertainment polls need more of this anticipation energy on the homepage.",
      "This one feels tailor-made for embedded polls on entertainment sites."
    ]
  },
  {
    title: "Should streaming platforms favour weekly episodes over full-season drops?",
    blurb: "A strong recurring question with obvious trade-offs and a broad audience.",
    description:
      "Tracks whether viewers value a slower communal conversation cycle or still prefer binge releases for convenience and pace.",
    category_key: "entertainment",
    options: ["Weekly release", "Full season drop", "Hybrid depending on show"],
    biasPercentages: [24, 29, 47],
    createdDaysAgo: 18,
    endDays: 24,
    voteRange: [900, 1500],
    activityProfile: "cooling",
    commentSeeds: [
      "Hybrid is probably the answer most people land on once they think about it.",
      "This is a good example of a poll where the middle option should probably win.",
      "Weekly drops make culture feel bigger, even if bingeing is easier.",
      "This kind of question gives you very readable comments because everyone has examples.",
      "It also feels advertiser-friendly because the audience is easy to understand.",
      "The discussion here would probably be stronger than the raw vote total."
    ]
  },
  {
    title: "Should social platforms hide like counts by default?",
    blurb: "Simple to grasp, culturally current, and good for debate-heavy comments.",
    description:
      "Measures whether visible engagement improves discovery or mostly amplifies social pressure and lowest-common-denominator posting incentives.",
    category_key: "culture",
    options: ["Yes", "No"],
    biasPercentages: [46, 54],
    createdDaysAgo: 13,
    endDays: 19,
    voteRange: [1100, 1750],
    activityProfile: "steady",
    commentSeeds: [
      "This is one of those internet policy questions where people want both transparency and less pressure.",
      "Creators and normal users will vote very differently here.",
      "A close split actually helps the homepage because it looks alive.",
      "If the comments are good, this becomes a really strong demo poll.",
      "The business model angle makes this more interesting than it first appears.",
      "Feels especially relevant while every platform is chasing more engagement."
    ]
  },
  {
    title: "Should museums return contested artefacts to countries of origin?",
    blurb: "A culture question with ethics, law, and identity all wrapped together.",
    description:
      "Tracks whether people favour broad restitution, case-by-case review, or keeping current collections intact for global access and preservation.",
    category_key: "culture",
    options: ["Yes, broadly", "Case by case", "No, keep them"],
    biasPercentages: [32, 48, 20],
    createdDaysAgo: 23,
    endDays: 27,
    voteRange: [700, 1200],
    activityProfile: "cooling",
    commentSeeds: [
      "Case-by-case is probably where most people land once the legal details appear.",
      "This is a more thoughtful culture poll and gives the homepage some depth.",
      "It also shows the platform isn’t only built for sports and politics.",
      "A good blurb matters on polls like this because the ethics are more nuanced.",
      "This is the sort of poll universities and museums might actually embed.",
      "I like that there isn’t an easy slogan answer to it."
    ]
  },
  {
    title: "Should UK cities pedestrianise more central high streets?",
    blurb: "A practical lifestyle question with a real local-politics feel.",
    description:
      "Measures whether voters prioritise cleaner, more walkable centres or still think car access should dominate city-centre planning.",
    category_key: "culture",
    options: ["Yes, more of them", "Only selectively", "No"],
    biasPercentages: [38, 45, 17],
    createdDaysAgo: 15,
    endDays: 31,
    voteRange: [650, 1150],
    activityProfile: "steady",
    commentSeeds: [
      "This is exactly the type of question that would be huge once local mode exists.",
      "Selective seems like the politically safe answer, but people still care a lot.",
      "This topic is a good bridge between culture and local politics.",
      "A localised version of this could become a serious product line later.",
      "I’d expect city centre workers and suburban drivers to vote very differently.",
      "This one feels especially useful for sponsored polling in the future."
    ]
  },
  {
    title: "Should phone-free concerts become the norm?",
    blurb: "A clean culture poll with strong yes/no energy and plenty of comments.",
    description:
      "Tracks whether people think phone restrictions improve the experience or unfairly police how audiences capture and remember live events.",
    category_key: "culture",
    options: ["Yes", "No"],
    biasPercentages: [58, 42],
    createdDaysAgo: 4,
    endDays: 11,
    voteRange: [950, 1650],
    activityProfile: "surging",
    commentSeeds: [
      "This is one of those questions where everyone thinks their own concert behavior is reasonable.",
      "Phone-free gigs sound great until it’s the one show you really wanted a clip from.",
      "It is also just a very good-looking binary card for the homepage.",
      "I can imagine artists sharing this into fan communities immediately.",
      "The comments here should be great because both sides feel emotionally right.",
      "This is exactly the sort of cultural hot-take that keeps people on the site."
    ]
  },
  {
    title: "Should a four-day work week be the default by 2030?",
    blurb: "A strong hot-take poll with broad appeal beyond politics audiences.",
    description:
      "Measures whether people see shorter work weeks as a realistic productivity upgrade or an appealing idea that breaks down outside a narrow set of industries.",
    category_key: "hot-takes",
    options: ["Yes", "No"],
    biasPercentages: [61, 39],
    createdDaysAgo: 17,
    endDays: 29,
    voteRange: [1500, 2350],
    activityProfile: "steady",
    commentSeeds: [
      "This feels like one of the most naturally viral polls on the platform.",
      "Almost everyone likes the idea, but implementation is where the split opens up.",
      "A lot of these demo investors will probably vote on this one immediately.",
      "This is a good example of a question that is opinion-led but still commercially useful.",
      "The comments would be better if people mention which industry they work in.",
      "Great hot-take card because you don’t need any context to answer it."
    ]
  },
  {
    title: "Should university tuition be replaced with a graduate tax?",
    blurb: "A more serious economic hot-take with strong policy crossover.",
    description:
      "Tracks whether people think a graduate tax is a fairer long-term model than fee loans, or whether it simply changes who pays and when.",
    category_key: "hot-takes",
    options: ["Yes", "No", "Need more detail"],
    biasPercentages: [37, 28, 35],
    createdDaysAgo: 20,
    endDays: 30,
    voteRange: [720, 1280],
    activityProfile: "cooling",
    commentSeeds: [
      "Need more detail is the honest answer for most people here.",
      "This is a good example of a more thoughtful hot-take rather than a throwaway one.",
      "The fairness argument is strong, but nobody trusts the policy design.",
      "Questions like this make the site feel more substantial to investors.",
      "Student finance is one of those issues where everyone has a story or a scar.",
      "A UK audience will understand this instantly even if they disagree on the fix."
    ]
  },
  {
    title: "Should remote work remain the default for office-based jobs?",
    blurb: "A broad, relevant workplace question with strong demographic potential later.",
    description:
      "Measures whether people think office-first culture is returning for good or whether flexible remote norms have become the baseline expectation.",
    category_key: "hot-takes",
    options: ["Yes", "No", "Hybrid should be default"],
    biasPercentages: [19, 16, 65],
    createdDaysAgo: 9,
    endDays: 21,
    voteRange: [1050, 1750],
    activityProfile: "surging",
    commentSeeds: [
      "Hybrid winning would make total sense and still tell a useful story.",
      "This is the kind of poll brands and employers would definitely care about later.",
      "You can imagine strong splits here by age, city, and salary band.",
      "It’s a very demo-friendly question because everyone instantly gets it.",
      "Remote versus hybrid versus office is exactly the kind of structured opinion data people will pay for.",
      "This poll probably matters more commercially than a lot of the fun ones."
    ]
  }
];

const commentUpvotePresets = [
  [42, 33, 28, 21, 18, 15, 12, 10, 8, 6, 5, 4],
  [55, 41, 34, 29, 25, 18, 16, 12, 9, 8, 6, 5],
  [37, 31, 26, 22, 17, 14, 12, 10, 8, 7, 5, 4]
];

const usernamePrefixes = [
  "Westminster",
  "Market",
  "NorthStar",
  "BlueRoom",
  "Signal",
  "QuickTake",
  "OpenLine",
  "RedBench",
  "Trend",
  "Civic",
  "WideAngle",
  "TownHall",
  "Motion",
  "Crosswind",
  "SideLine",
  "FourthStand",
  "NightShift",
  "FirstRead"
];

const usernameSuffixes = [
  "Watch",
  "Wire",
  "Scope",
  "Pulse",
  "View",
  "Signal",
  "Forum",
  "Desk",
  "Brief",
  "Room",
  "Line",
  "Edit",
  "Feed",
  "Lens",
  "Roundup",
  "Score"
];

const envPath = path.join(process.cwd(), ".env.local");
if (!fs.existsSync(envPath)) {
  throw new Error(".env.local not found in project root");
}

const env = parseEnvFile(envPath);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRole = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRole) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
}

const supabase = createClient(url, serviceRole, { auth: { autoRefreshToken: false, persistSession: false } });

async function listDemoUsers() {
  const allUsers = [];
  let page = 1;
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      throw new Error(`Failed listing auth users: ${error.message}`);
    }
    const users = data?.users ?? [];
    allUsers.push(...users);
    if (users.length < 200) break;
    page += 1;
  }

  return allUsers.filter((user) => user.email?.endsWith("@pulsepoint.local"));
}

function buildUsername(index) {
  const prefix = usernamePrefixes[index % usernamePrefixes.length];
  const suffix = usernameSuffixes[Math.floor(index / usernamePrefixes.length) % usernameSuffixes.length];
  const serial = String(index + 1).padStart(2, "0");
  return `demo_${prefix}${suffix}${serial}`.toLowerCase();
}

async function ensureDemoProfiles(targetCount) {
  let demoUsers = await listDemoUsers();

  for (let index = demoUsers.length; index < targetCount; index += 1) {
    const suffix = String(index + 1).padStart(3, "0");
    const email = `demo.seed.${suffix}@pulsepoint.local`;
    const { error } = await supabase.auth.admin.createUser({
      email,
      password: `DemoSeed!${suffix}x`,
      email_confirm: true,
      user_metadata: { seed: "poll-demo" }
    });

    if (error && !error.message.toLowerCase().includes("already registered")) {
      throw new Error(`Failed creating demo user ${email}: ${error.message}`);
    }
  }

  demoUsers = await listDemoUsers();
  if (demoUsers.length < targetCount) {
    throw new Error(`Expected ${targetCount} demo users but found ${demoUsers.length}`);
  }

  const chosenUsers = demoUsers.slice(0, targetCount);
  const usernameUpdates = chosenUsers.map((user, index) => ({
    id: user.id,
    username: buildUsername(index)
  }));

  for (const batch of chunk(usernameUpdates, 200)) {
    const { error } = await supabase.from("profiles").upsert(batch, { onConflict: "id" });
    if (error) {
      throw new Error(`Failed syncing demo usernames: ${error.message}`);
    }
  }

  return chosenUsers.map((user) => user.id);
}

async function clearSeededPollDependencies(pollIds) {
  if (pollIds.length === 0) return;

  const { data: commentRows, error: commentReadError } = await supabase
    .from("poll_comments")
    .select("id,poll_id")
    .in("poll_id", pollIds);

  if (commentReadError) {
    throw new Error(`Failed reading existing comments: ${commentReadError.message}`);
  }

  const commentIds = (commentRows ?? []).map((row) => row.id);
  if (commentIds.length > 0) {
    const { error: clearCommentVotesError } = await supabase
      .from("poll_comment_votes")
      .delete()
      .in("comment_id", commentIds);
    if (clearCommentVotesError) {
      throw new Error(`Failed clearing comment votes: ${clearCommentVotesError.message}`);
    }
  }

  const { error: clearCommentsError } = await supabase.from("poll_comments").delete().in("poll_id", pollIds);
  if (clearCommentsError) {
    throw new Error(`Failed clearing comments: ${clearCommentsError.message}`);
  }

  const { error: clearBookmarksError } = await supabase.from("poll_bookmarks").delete().in("poll_id", pollIds);
  if (clearBookmarksError) {
    throw new Error(`Failed clearing bookmarks: ${clearBookmarksError.message}`);
  }

  const { error: clearPollEventsError } = await supabase.from("poll_events").delete().in("poll_id", pollIds);
  if (clearPollEventsError) {
    throw new Error(`Failed clearing poll events: ${clearPollEventsError.message}`);
  }

  const { error: clearVoteEventsError } = await supabase.from("vote_events").delete().in("poll_id", pollIds);
  if (clearVoteEventsError) {
    throw new Error(`Failed clearing vote events: ${clearVoteEventsError.message}`);
  }

  const { error: clearVotesError } = await supabase.from("votes").delete().in("poll_id", pollIds);
  if (clearVotesError) {
    throw new Error(`Failed clearing votes: ${clearVotesError.message}`);
  }

  const { error: clearOptionsError } = await supabase.from("poll_options").delete().in("poll_id", pollIds);
  if (clearOptionsError) {
    throw new Error(`Failed clearing poll options: ${clearOptionsError.message}`);
  }
}

async function deleteObsoleteSeedPolls(nextSlugs) {
  const { data: existingSeeded, error } = await supabase
    .from("polls")
    .select("id,slug")
    .eq("source_type", "admin_seed");

  if (error) {
    throw new Error(`Failed reading existing seeded polls: ${error.message}`);
  }

  const obsolete = (existingSeeded ?? []).filter((row) => !nextSlugs.has(row.slug));
  if (obsolete.length === 0) return;

  const obsoleteIds = obsolete.map((row) => row.id);
  await clearSeededPollDependencies(obsoleteIds);

  const { error: deletePollsError } = await supabase.from("polls").delete().in("id", obsoleteIds);
  if (deletePollsError) {
    throw new Error(`Failed deleting obsolete seeded polls: ${deletePollsError.message}`);
  }
}

async function seedVotesForPoll({ pollId, optionRows, poll, profileIds }) {
  const [minVotes, maxVotes] = poll.voteRange;
  const targetVotes = randomInt(minVotes, maxVotes);
  const availableVoters = shuffle(profileIds).slice(0, Math.min(targetVotes, profileIds.length));
  const distribution = buildVoteDistribution(optionRows.length, availableVoters.length, buildPercentBias(poll.biasPercentages));
  const timestamps = generateActivityTimestamps(availableVoters.length, poll.activityProfile);

  const voteRows = [];
  const voteEventRows = [];
  const voteAnalyticsRows = [];
  let cursor = 0;

  for (let optionIndex = 0; optionIndex < optionRows.length; optionIndex += 1) {
    const count = distribution[optionIndex];
    for (let index = 0; index < count; index += 1) {
      const userId = availableVoters[cursor];
      const changedAt = timestamps[cursor];
      cursor += 1;
      if (!userId || !changedAt) continue;

      voteRows.push({
        poll_id: pollId,
        option_id: optionRows[optionIndex].id,
        user_id: userId
      });
      voteEventRows.push({
        poll_id: pollId,
        user_id: userId,
        previous_option_id: null,
        new_option_id: optionRows[optionIndex].id,
        changed_at: changedAt
      });
      voteAnalyticsRows.push({
        poll_id: pollId,
        user_id: userId,
        event_type: "vote_cast",
        source: "seed_script",
        metadata: { seeded: true },
        created_at: changedAt
      });
    }
  }

  for (const batch of chunk(voteRows, 500)) {
    const { error } = await supabase.from("votes").insert(batch);
    if (error) {
      throw new Error(`Failed inserting votes for poll ${poll.title}: ${error.message}`);
    }
  }

  for (const batch of chunk(voteEventRows, 500)) {
    const { error } = await supabase.from("vote_events").insert(batch);
    if (error) {
      throw new Error(`Failed inserting vote events for poll ${poll.title}: ${error.message}`);
    }
  }

  for (const batch of chunk(voteAnalyticsRows, 500)) {
    const { error } = await supabase.from("poll_events").insert(batch);
    if (error) {
      throw new Error(`Failed inserting vote analytics for poll ${poll.title}: ${error.message}`);
    }
  }

  return voteRows.length;
}

async function seedCommentsForPoll({ pollId, poll, profileIds }) {
  const desiredCount = randomInt(14, 24);
  const commentBodies = buildCommentBodies(poll, desiredCount);
  const commentAuthors = shuffle(profileIds).slice(0, commentBodies.length);
  const commentTimes = generateActivityTimestamps(commentBodies.length, poll.activityProfile);

  const insertedComments = [];
  for (let index = 0; index < commentBodies.length; index += 1) {
    const payload = {
      poll_id: pollId,
      user_id: commentAuthors[index],
      body: commentBodies[index],
      created_at: commentTimes[index]
    };
    const { data, error } = await supabase.from("poll_comments").insert(payload).select("id").single();
    if (error) {
      throw new Error(`Failed inserting comment for poll ${poll.title}: ${error.message}`);
    }
    insertedComments.push({
      id: data.id,
      userId: commentAuthors[index],
      createdAt: commentTimes[index]
    });
  }

  const preset = sample(commentUpvotePresets);
  const commentVoteRows = [];
  const commentEventRows = insertedComments.map((comment) => ({
    poll_id: pollId,
    user_id: comment.userId,
    event_type: "comment_post",
    source: "seed_script",
    metadata: { seeded: true },
    created_at: comment.createdAt
  }));

  insertedComments.forEach((comment, index) => {
    const upvoteTarget = Math.min(
      randomInt(Math.max(2, Math.floor((preset[index % preset.length] ?? 6) * 0.6)), preset[index % preset.length] ?? 10),
      profileIds.length - 1
    );

    const voters = shuffle(profileIds.filter((id) => id !== comment.userId)).slice(0, upvoteTarget);
    voters.forEach((voterId, voterIndex) => {
      commentVoteRows.push({
        poll_id: pollId,
        comment_id: comment.id,
        user_id: voterId,
        created_at: new Date(Date.parse(comment.createdAt) + (voterIndex + 1) * 60000).toISOString()
      });
    });
  });

  for (const batch of chunk(commentVoteRows, 500)) {
    const { error } = await supabase.from("poll_comment_votes").insert(batch);
    if (error) {
      throw new Error(`Failed inserting comment votes for poll ${poll.title}: ${error.message}`);
    }
  }

  for (const batch of chunk(commentEventRows, 200)) {
    const { error } = await supabase.from("poll_events").insert(batch);
    if (error) {
      throw new Error(`Failed inserting comment analytics for poll ${poll.title}: ${error.message}`);
    }
  }

  return insertedComments.length;
}

async function seedEngagementEventsForPoll({ pollId, poll, profileIds, voteCount, commentCount }) {
  const impressionCount = Math.max(voteCount * randomInt(10, 16), 6000);
  const viewCount = Math.max(voteCount * randomInt(3, 5), 1800);
  const shareCount = Math.max(Math.round(voteCount * (0.08 + Math.random() * 0.08)), 80);
  const bookmarkCount = Math.max(Math.round(voteCount * (0.04 + Math.random() * 0.04)), 45);

  const impressions = generateActivityTimestamps(impressionCount, poll.activityProfile).map((createdAt, index) => ({
    poll_id: pollId,
    user_id: profileIds[index % profileIds.length] ?? null,
    event_type: "poll_impression",
    source: "seed_script",
    metadata: { seeded: true },
    created_at: createdAt
  }));
  const views = generateActivityTimestamps(viewCount, poll.activityProfile).map((createdAt, index) => ({
    poll_id: pollId,
    user_id: profileIds[(index * 3) % profileIds.length] ?? null,
    event_type: "poll_view",
    source: "seed_script",
    metadata: { seeded: true },
    created_at: createdAt
  }));
  const shares = generateActivityTimestamps(shareCount, poll.activityProfile).map((createdAt, index) => ({
    poll_id: pollId,
    user_id: profileIds[(index * 5) % profileIds.length] ?? null,
    event_type: "poll_share",
    source: "seed_script",
    metadata: { seeded: true },
    created_at: createdAt
  }));
  const bookmarks = generateActivityTimestamps(bookmarkCount, poll.activityProfile).map((createdAt, index) => ({
    poll_id: pollId,
    user_id: profileIds[(index * 7) % profileIds.length] ?? null,
    event_type: "bookmark_add",
    source: "seed_script",
    metadata: { seeded: true, commentCount },
    created_at: createdAt
  }));

  for (const batch of chunk([...impressions, ...views, ...shares, ...bookmarks], 500)) {
    const { error } = await supabase.from("poll_events").insert(batch);
    if (error) {
      throw new Error(`Failed inserting engagement analytics for poll ${poll.title}: ${error.message}`);
    }
  }
}

const profileIds = await ensureDemoProfiles(1800);
if (profileIds.length < 400) {
  throw new Error("Not enough demo profiles to seed varied demo activity.");
}

const nextSlugs = new Set(demoPolls.map((poll) => slugify(poll.title)));
await deleteObsoleteSeedPolls(nextSlugs);

for (const poll of demoPolls) {
  const slug = slugify(poll.title);
  const createdAt = new Date(Date.now() - poll.createdDaysAgo * 24 * 60 * 60 * 1000).toISOString();
  const endAt = new Date(Date.now() + poll.endDays * 24 * 60 * 60 * 1000).toISOString();

  const { data: pollRow, error: pollErr } = await supabase
    .from("polls")
    .upsert(
      {
        slug,
        title: poll.title,
        blurb: poll.blurb,
        description: buildDetailDescription(poll),
        category_key: poll.category_key,
        status: "published",
        source_type: "admin_seed",
        start_at: createdAt,
        end_at: endAt,
        created_at: createdAt
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (pollErr) {
    throw new Error(`Poll upsert failed for ${poll.title}: ${pollErr.message}`);
  }

  const pollId = pollRow.id;
  await clearSeededPollDependencies([pollId]);

  const { error: pollRefreshError } = await supabase
    .from("polls")
    .update({
      title: poll.title,
      blurb: poll.blurb,
      description: buildDetailDescription(poll),
      category_key: poll.category_key,
      status: "published",
      source_type: "admin_seed",
      start_at: createdAt,
      end_at: endAt,
      created_at: createdAt
    })
    .eq("id", pollId);

  if (pollRefreshError) {
    throw new Error(`Poll refresh failed for ${poll.title}: ${pollRefreshError.message}`);
  }

  const optionsPayload = poll.options.map((label, index) => ({
    poll_id: pollId,
    label,
    position: index + 1
  }));
  const { error: optErr } = await supabase.from("poll_options").insert(optionsPayload);
  if (optErr) {
    throw new Error(`Options insert failed for ${poll.title}: ${optErr.message}`);
  }

  const { data: optionRows, error: optionRowsError } = await supabase
    .from("poll_options")
    .select("id,label")
    .eq("poll_id", pollId)
    .order("position", { ascending: true });

  if (optionRowsError || !optionRows) {
    throw new Error(`Failed reading options for ${poll.title}: ${optionRowsError?.message ?? "unknown error"}`);
  }

  const votesInserted = await seedVotesForPoll({
    pollId,
    optionRows,
    poll,
    profileIds
  });
  const commentsInserted = await seedCommentsForPoll({
    pollId,
    poll,
    profileIds
  });
  await seedEngagementEventsForPoll({
    pollId,
    poll,
    profileIds,
    voteCount: votesInserted,
    commentCount: commentsInserted
  });

  console.log(`Seeded: ${poll.title} (${votesInserted} votes, ${commentsInserted} comments)`);
}

console.log("Demo seeding complete.");
