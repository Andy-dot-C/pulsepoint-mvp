import { notFound } from "next/navigation";
import { QuestionBankChecklist } from "@/components/question-bank-checklist";
import { fetchFeed } from "@/lib/data/polls";
import { CategoryKey, FeedTabKey, Poll } from "@/lib/types";

const NEW_QUESTION_SUGGESTIONS: string[] = [
  "If a UK general election were held tomorrow, which party would get your vote?",
  "Which issue matters most to your vote right now: immigration, cost of living, NHS, housing, or crime?",
  "What should happen to legal immigration in the U.S.: increase, reduce, or stay the same?",
  "Which economic issue worries you most right now: inflation, housing costs, jobs, taxes, or public debt?",
  "What should the UK do next on social media for under-16s: full ban, time limits, stronger age checks, or no change?",
  "Which voting-age option feels most reasonable for the UK: 16, 17, 18, or 21?",
  "What should happen next on assisted dying in the UK: legalise now, trial it, delay it, or reject it?",
  "Which public service needs the biggest overhaul first: NHS, rail, local councils, schools?",
  "What is the best long-term model for UK rail: full renationalisation, mixed model, private franchises, or regional control?",
  "Which housing policy would make the biggest difference: build more homes, rent caps, planning reform, or tax empty homes?",
  "What should happen to zero-hours contracts: ban them, tighten rules, keep them, or expand worker protections only?",
  "Which work model would you choose for office-based jobs: fully remote, hybrid, office-first, or team choice?",
  "What should governments prioritise more on AI: safety, speed of innovation, open access, or national competitiveness?",
  "Which AI rule would add the most trust: watermarking, model licensing, training-data transparency, or audit trails?",
  "What is the bigger AI risk right now: misinformation, job losses, bias, cyber misuse, or concentration of power?",
  "Which tax change would you support first: wealth tax, inheritance-tax reform, lower income tax, or corporate tax reform?",
  "What should happen to congressional stock trading: full ban, blind trusts only, tighter disclosure, or no change?",
  "Which climate policy would you prioritise first: nuclear, renewables, carbon taxes, grid upgrades, or insulation?",
  "Which consumer price increase frustrates you most right now: food, rent, energy, transport, or childcare?",
  "Who should be England's first-choice right-back at the next World Cup: Trent Alexander-Arnold, Kyle Walker, Reece James, or someone else?",
  "Which Premier League rule change would improve the league most: live VAR audio, stricter PSR, salary controls, or referee reviews?",
  "What is the biggest problem with VAR right now: delays, inconsistency, lack of transparency, overuse, or poor communication?",
  "Who is most likely to win the next Premier League title: Arsenal, Liverpool, Manchester City, or another club?",
  "Which Premier League signing has had the biggest impact this season?",
  "Who will win the next Champions League: Real Madrid, Manchester City, Bayern Munich, Arsenal, or another side?",
  "What should happen next with F1 sprint weekends: expand them, keep them as they are, reduce them, or scrap them?",
  "Which Formula 1 rule change would improve the sport most: fewer sprint weekends, less dirty air, simpler penalties, or budget-cap reform?",
  "Which F1 team looks best placed for the next regulation cycle: Red Bull, Ferrari, McLaren, Mercedes, or another team?",
  "What should the FIA do on battery harvesting and deployment rules after the Bearman incident: tighten them now, test changes first, wait for more data, or leave them alone?",
  "Which sport is doing the best job using technology in officiating right now: football, tennis, cricket, rugby, or Formula 1?"
];

const LOCKED_INVESTOR_PICKS: string[] = [
  "Are U.S. tariffs worth it if they raise consumer prices?",
  "Has U.S. immigration enforcement gone too far in major cities?",
  "Should legal immigration to the U.S. be increased, reduced, or kept the same?",
  "Should live VAR audio be broadcast during Premier League matches?",
  "Should remote work remain the default for office-based jobs?",
  "Should the EU delay stricter AI rules to protect competitiveness?",
  "What should happen next on assisted dying in the UK: legalise now, trial it, delay it, or reject it?",
  "Which voting-age option feels most reasonable for the UK: 16, 17, 18, or 21?",
  "Should the UK restrict social media access for under-16s?",
  "Should UK commuter rail be fully renationalised?",
  "Should the UK adopt proportional representation for general elections?",
  "Should social media platforms verify age with mandatory ID checks?",
  "Should the UK rejoin the EU single market?",
  "Should zero-hours contracts be banned?",
  "If a UK general election were held tomorrow, which party would get your vote?",
  "What should happen to congressional stock trading: full ban, blind trusts only, tighter disclosure, or no change?",
  "Do you think AI-generated content should be clearly watermarked?",
  "Would you back a UK sovereign AI investment fund?",
  "Do you think wealth taxes should apply above $10m/£10m?",
  "Do you think repeat violent offenders should face tougher sentencing?",
  "Do you think digital ID should be required for financial accounts?",
  "Would you support lowering inheritance-tax thresholds?",
  "Are you happy with the current level of immigration in your country?",
  "Would you vote for a party that promised rail renationalisation?",
  "Would you support salary controls in the Premier League?",
  "Are you in favour of replacing council tax with a land-value tax?",
  "Are you happy with Formula 1 sprint weekends being part of the calendar?",
  "Which issue matters most to your vote right now: immigration, cost of living, NHS, housing, or crime?",
  "Which economic issue worries you most right now: inflation, housing costs, jobs, taxes, or public debt?",
  "Which public service needs the biggest overhaul first: NHS, rail, local councils, schools?",
  "What is the bigger AI risk right now: misinformation, job losses, bias, cyber misuse, or concentration of power?",
  "Who will win the next Champions League: Real Madrid, Manchester City, Bayern Munich, Arsenal, or another side?",
  "Which sport is doing the best job using technology in officiating right now: football, tennis, cricket, rugby, or Formula 1?"
];

const TABS: FeedTabKey[] = ["trending", "breaking", "new"];
const CATEGORIES: Array<CategoryKey | "all"> = [
  "all",
  "politics",
  "sport",
  "entertainment",
  "business",
  "technology"
];

function uniqueSortedTitles(polls: Poll[]): string[] {
  const seen = new Set<string>();
  const titles: string[] = [];
  for (const poll of polls) {
    const title = poll.title.trim();
    const key = title.toLowerCase();
    if (!title || seen.has(key)) continue;
    seen.add(key);
    titles.push(title);
  }
  return titles.sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));
}

export default async function QuestionBankPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const feeds = await Promise.all(
    TABS.flatMap((tab) =>
      CATEGORIES.map((category) =>
        fetchFeed({
          tab,
          category,
          q: ""
        })
      )
    )
  );

  const currentQuestions = uniqueSortedTitles(feeds.flat());
  return (
    <main className="page-shell question-bank-page">
      <QuestionBankChecklist
        lockedQuestions={LOCKED_INVESTOR_PICKS}
        currentQuestions={currentQuestions}
        proposedQuestions={NEW_QUESTION_SUGGESTIONS}
      />
    </main>
  );
}
