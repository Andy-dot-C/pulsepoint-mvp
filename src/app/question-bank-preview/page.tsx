import { notFound } from "next/navigation";
import { QuestionBankChecklist } from "@/components/question-bank-checklist";
import { fetchFeed } from "@/lib/data/polls";
import { CategoryKey, FeedTabKey, Poll } from "@/lib/types";

const NEW_QUESTION_SUGGESTIONS: string[] = [
  "Are you in favour of lowering the UK voting age to 16?",
  "Are you happy with the current level of immigration in your country?",
  "Would you support a nationwide ban on congressional stock trading?",
  "Do you think AI-generated political content should carry a legal label?",
  "Would you want social media companies to verify age with government ID?",
  "Would you be open to a four-day work week becoming standard by 2030?",
  "How do you feel about banning smartphones in schools for under-16s?",
  "Do you agree with raising taxes on empty homes in city centres?",
  "Would you vote for a party that promised rail renationalisation?",
  "Would you back stricter sentencing for repeat violent offenders?",
  "Are you in favour of legalising assisted dying for terminally ill adults?",
  "Are you happy with how quickly governments are regulating AI?",
  "Would you support rent caps in major cities?",
  "Do you think governments should cap annual energy bill increases?",
  "Would you want political donations above $1,000 disclosed in real time?",
  "Would you be open to a wealth tax above $10m/£10m?",
  "How do you feel about introducing national service at age 18?",
  "Do you agree with banning gambling sponsors on football shirts?",
  "Would you vote for a policy that expands nuclear energy capacity?",
  "Would you back mandatory cybersecurity standards for smart-home devices?",
  "Are you in favour of central bank digital currencies for everyday use?",
  "Are you happy with current protections for gig-economy workers?",
  "Would you support classifying gig workers as employees by default?",
  "Do you think zero-hours contracts should be phased out?",
  "Would you want all job ads to include salary bands?",
  "Would you be open to higher taxes on domestic flights?",
  "How do you feel about congestion charging in major city centres?",
  "Do you agree with capping short-term rentals in urban hotspots?",
  "Would you vote for a manifesto that bans facial recognition in public spaces?",
  "Would you back stricter rules on deepfake content in elections?",
  "Are you in favour of making election day a public holiday?",
  "Are you happy with the influence of Big Tech in public debate?",
  "Would you support breaking up dominant tech platforms?",
  "Do you think app stores should allow sideloading by default?",
  "Would you want governments to subsidise domestic chip manufacturing?",
  "Would you be open to term limits for constitutional or supreme court judges?",
  "How do you feel about age limits for top political office?",
  "Do you agree with automatic inflation indexing for tax brackets?",
  "Would you vote for a carbon border tax on high-emission imports?",
  "Would you back mandatory climate-risk reporting for large companies?",
  "Are you in favour of guaranteed paid family leave?",
  "Are you happy with current childcare affordability in your country?",
  "Would you support universal free school meals?",
  "Do you think apprenticeships should receive equal funding to university routes?",
  "Would you want tuition fees reduced even if taxes rise?",
  "Would you be open to means-testing winter fuel support?",
  "How do you feel about making IVF fully covered by public healthcare?",
  "Do you agree with tighter alcohol advertising rules?",
  "Would you vote for legal recreational cannabis?",
  "Would you back mandatory body-cam footage release after serious incidents?",
  "Are you in favour of publishing referee audio live in top-flight football?",
  "Are you happy with the current use of VAR in football?",
  "Would you support salary controls in the Premier League?",
  "Do you think UEFA should expand places for smaller leagues?",
  "Would you want women’s sports to have guaranteed prime-time broadcast slots?",
  "Would you be open to permanent rotating Olympic host cities?",
  "How do you feel about banning gambling ads during live sport?",
  "Do you agree with introducing independent match-official reviews after each game?",
  "Would you vote for stricter ownership tests for football clubs?",
  "Would you back mandatory concussion protocols across all youth sports?",
  "Are you in favour of mandatory AI safety testing before public release?",
  "Are you happy with transparency from frontier AI labs?",
  "Would you support licensing requirements for the most advanced AI models?",
  "Do you think AI companies should publish energy and water usage data?",
  "Would you want schools to teach AI literacy from age 11?",
  "Would you be open to AI copilots in public healthcare triage?",
  "How do you feel about AI-generated music winning major awards?",
  "Do you agree with requiring explicit consent for AI voice cloning?",
  "Would you vote for tighter controls on AI in hiring decisions?",
  "Would you back public investment in a national AI compute infrastructure?",
  "Are you in favour of recognising a Palestinian state now?",
  "Are you happy with current defence spending levels?",
  "Would you support defence spending above 3% of GDP?",
  "Do you think humanitarian aid budgets should be legally protected?",
  "Would you want stricter sanctions on companies helping sanctions evasion?",
  "Would you be open to climate migration visa pathways?",
  "How do you feel about export controls on advanced semiconductor chips?",
  "Do you agree with increasing domestic manufacturing for critical medicines?",
  "Would you vote for stricter foreign ownership rules on strategic assets?",
  "Would you back treaty commitments on AI weapons limits?",
  "Are you in favour of annual property-tax revaluations?",
  "Are you happy with first-time buyer support in your country?",
  "Would you support first-time buyers getting priority in new developments?",
  "Do you think institutional landlords should face stronger tenant protections?",
  "Would you want vacant urban commercial units converted to housing faster?",
  "Would you be open to planning reforms that trade height for affordability?",
  "How do you feel about mandatory accessibility quotas for ride-hailing fleets?",
  "Do you agree with banning sale of new gas boilers after 2030?",
  "Would you vote for mandatory heat pumps in all new homes?",
  "Would you back a major upgrade plan for electricity grids?",
  "Are you in favour of replacing council tax with a land-value tax?",
  "Are you happy with current public transport reliability where you live?",
  "Would you support inflation-linked caps on rail fares?",
  "Do you think high-speed rail expansion should pause until existing lines improve?",
  "Would you want employers to guarantee a right to request remote work?",
  "Would you be open to a legal right to disconnect outside work hours?",
  "How do you feel about requiring companies to disclose AI use in customer service?",
  "Do you agree with stricter anti-monopoly rules for cloud providers?",
  "Would you vote for compulsory digital ID for opening financial accounts?",
  "Would you back ring-fencing customer assets at all crypto exchanges?",
  "Are you happy with Formula 1 sprint weekends being part of the calendar?",
  "Would you support a stricter budget cap in Formula 1?",
  "Do you think Formula 1 should increase the number of street circuits?",
  "Would you vote for bringing back refuelling in Formula 1 races?",
  "Are you in favour of Formula 1 introducing reverse-grid races?",
  "Would you support stricter penalties for repeated track-limits violations in Formula 1?",
  "How do you feel about Formula 1 adding an 11th team to the grid?",
  "Do you agree with limiting team radio coaching during Formula 1 races?",
  "Would you be open to Formula 1 reducing race weekends to 20 per season?",
  "Would you support a points-scoring system where more than 10 drivers score each race in Formula 1?"
];

const LOCKED_INVESTOR_PICKS: string[] = [
  "Are U.S. tariffs worth it if they raise consumer prices?",
  "Has U.S. immigration enforcement gone too far in major cities?",
  "Should legal immigration to the U.S. be increased, reduced, or kept the same?",
  "Should live VAR audio be broadcast during Premier League matches?",
  "Should remote work remain the default for office-based jobs?",
  "Should the EU delay stricter AI rules to protect competitiveness?",
  "Should the UK legalise assisted dying for terminally ill adults?",
  "Should the UK lower the voting age to 16?",
  "Should the UK restrict social media access for under-16s?",
  "Should UK commuter rail be fully renationalised?",
  "Should the UK adopt proportional representation for general elections?",
  "Should social media platforms verify age with mandatory ID checks?",
  "Should the UK rejoin the EU single market?",
  "Should zero-hours contracts be banned?",
  "Would you support lowering the UK voting age to 16?",
  "Would you back a nationwide ban on congressional stock trading?",
  "Do you think AI-generated content should be clearly watermarked?",
  "Would you back a UK sovereign AI investment fund?",
  "Do you think wealth taxes should apply above $10m/£10m?",
  "Do you think repeat violent offenders should face tougher sentencing?",
  "Do you think digital ID should be required for financial accounts?",
  "Would you support lowering inheritance-tax thresholds?",
  "Are you happy with the current level of immigration in your country?",
  "Would you support a nationwide ban on congressional stock trading?",
  "Would you vote for a party that promised rail renationalisation?",
  "Would you support salary controls in the Premier League?",
  "Are you in favour of replacing council tax with a land-value tax?",
  "Are you happy with Formula 1 sprint weekends being part of the calendar?"
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
