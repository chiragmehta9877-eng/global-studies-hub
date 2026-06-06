// components/DecoyPortal.js
"use client";
import { useState } from "react";
import { BookOpen, Clock, GraduationCap, LayoutDashboard, FileText, Calendar, Award, Menu } from "lucide-react";

// --- THE ULTIMATE OVERWHELMING DECOY DATA ---
const ACADEMIC_DATA = {
  "TOUR-304": {
    title: "Sustainable Eco-Tourism & Global Policy Frameworks",
    prof: "Dr. Alistair Vance, Ph.D.",
    progress: 68,
    readTime: "4h 45m",
    modules: [
      {
        title: "Module 1: The Triple Bottom Line & Macro-Environmental Dynamics",
        content: `The intersection of sustainable practices and global tourism presents a complex paradigm. According to the United Nations World Tourism Organization (UNWTO), sustainable tourism must account for current and future economic, social, and environmental impacts. Elkington's framework requires that tourism enterprises measure their success not just by financial profitability (Profit), but also by their ecological footprint (Planet) and their socio-cultural impact on host communities (People). Furthermore, the implementation of ISO 20121 standards in event management has drastically altered how mega-events are structured globally. Students must review the carbon emission metrics of the aviation sector published in the 2025 Geneva Accords and contrast them with the Kyoto Protocol baseline metrics. The elasticity of tourism demand in response to eco-taxes remains a highly debated topic among neoclassical economists.`
      },
      {
        title: "Module 2: Carrying Capacity Dynamics & The Overtourism Epidemic",
        content: `Overtourism phenomena in destinations like Venice, Kyoto, and Barcelona highlight the critical threshold of Social Carrying Capacity. When visitor density surpasses this threshold, host community antagonism rises, leading to Doxey's Irridex Model stage of "Antagonism". The economic reliance on tourism often forces local governments into a 'growth paradigm trap', where policies favor short-term capital influx over long-term residential quality of life. The displacement of local populations due to short-term rental platforms (STRs) fundamentally alters the demographic and cultural fabric of heritage sites. Analysis of the Butler Destination Lifecycle suggests that without strict spatial zoning and tourist quotas, destinations inevitably enter the 'Decline' phase, characterized by degraded infrastructure and loss of authentic cultural capital.`
      },
      {
        title: "Module 3: Ecotourism Certification, Auditing, and Greenwashing",
        content: `A critical examination of eco-labels reveals a fragmented regulatory landscape. The Global Sustainable Tourism Council (GSTC) criteria provide a baseline, yet the proliferation of self-certified 'green' credentials leads to widespread consumer deception, commonly known as greenwashing. Analysis of case studies in the Costa Rican rainforest eco-lodges demonstrates the necessity for third-party auditing mechanisms to ensure true ecological mitigation rather than mere marketing rhetoric. We will explore the qualitative metrics used by the Rainforest Alliance and how they contrast with the more quantitatively rigorous LEED certification for hospitality infrastructure.`
      },
      {
        title: "Module 4: Community-Based Tourism (CBT) and Indigenous Rights",
        content: `Community-Based Tourism (CBT) flips the traditional top-down development model by placing control and majoritarian economic benefits directly into the hands of local communities. However, the operationalization of CBT faces severe bottlenecks, including lack of access to global distribution systems (GDS) and inadequate hospitality training. Furthermore, the commodification of indigenous rituals for tourist consumption raises severe ethical concerns regarding cultural appropriation. We will dissect the 2018 UN Declaration on the Rights of Indigenous Peoples (UNDRIP) in the context of tourism development in the Amazon basin.`
      },
      {
        title: "Module 5: Climate Change Adaptation in Coastal Tourism",
        content: `Rising sea levels, increased frequency of extreme weather events, and ocean acidification pose existential threats to coastal and island tourism economies. Small Island Developing States (SIDS) like the Maldives and Fiji are at the forefront of this crisis. The module covers the economic cost-benefit analysis of hard engineering solutions (e.g., seawalls, tetrapods) versus soft engineering (e.g., mangrove restoration, beach nourishment). The concept of 'Last Chance Tourism' (LCT)—where tourists rush to see endangered ecosystems like the Great Barrier Reef before they disappear—creates a paradoxical feedback loop of accelerated environmental degradation.`
      }
    ]
  },
  "IR-201": {
    title: "Global Geopolitics, Supply Chains & International Trade",
    prof: "Prof. Sarah Lin, M.Econ",
    progress: 42,
    readTime: "5h 10m",
    modules: [
      {
        title: "Module 1: Multi-polar Hegemony and Neo-Mercantilism",
        content: `Modern international relations are heavily dictated by bilateral trade agreements and economic corridors. The shift from unipolar to multipolar global hegemony has decentralized supply chains. The strategic positioning of maritime chokepoints—such as the Strait of Malacca, the Suez Canal, and the Strait of Hormuz—remains a primary driver of naval deployment and foreign policy formulations among superpowers. The resurgence of neo-mercantilist policies, characterized by aggressive export subsidies and currency manipulation, threatens the foundational principles of the Bretton Woods institutions.`
      },
      {
        title: "Module 2: The WTO Structural Crisis and Appellate Body Paralysis",
        content: `The Appellate Body of the World Trade Organization has faced structural crises since 2019, primarily due to the blockage of judge appointments. Students must analyze the case study of cross-border tariff impositions and their cascading effects on emerging economies. The differentiation between tariff barriers and Non-Tariff Barriers (NTBs) such as phytosanitary restrictions, technical quotas, and arbitrary anti-dumping duties often serves as thinly veiled protectionism. We will examine the dispute settlement mechanism (DSM) and its efficacy in the contemporary trade war environment.`
      },
      {
        title: "Module 3: Energy Geopolitics and the Petro-Dollar Transition",
        content: `The intrinsic link between national security and energy independence cannot be overstated. This module traces the historical dominance of the petro-dollar system and its modern challenges amidst the global push for decarbonization. We will evaluate the geopolitical leverage exercised by OPEC+ nations and the strategic implications of the European Union's Carbon Border Adjustment Mechanism (CBAM). The rare-earth element (REE) supply chain monopoly is also heavily scrutinized as the critical bottleneck for renewable energy transitions.`
      },
      {
        title: "Module 4: Economic Sanctions as an Instrument of Foreign Policy",
        content: `Economic sanctions represent a coercive tool sitting between diplomatic protest and military intervention. By analyzing primary source documents from the US Treasury’s Office of Foreign Assets Control (OFAC), we will evaluate the macroeconomic crippling effect of SWIFT exclusions and secondary sanctions. The module will critically assess the 'rally 'round the flag' effect, where targeted regimes successfully weaponize sanctions to consolidate domestic power, thereby neutralizing the intended policy behavioral changes.`
      },
      {
        title: "Module 5: Digital Trade, Data Localization, and Cyber Sovereignty",
        content: `As the global economy digitizes, cross-border data flows have become the new frontier of international trade negotiations. The conflict between the US model of free data flow, the EU's GDPR privacy-first model, and the strict data localization and censorship laws under models of Cyber Sovereignty creates a highly fragmented digital landscape. We will dissect the implications of these competing frameworks on multinational enterprise operations and global cloud infrastructure.`
      }
    ]
  },
  "CUL-105": {
    title: "Heritage Conservation, Urban Sociology & Museum Studies",
    prof: "Dr. Rajiv Menon, D.Phil",
    progress: 85,
    readTime: "3h 15m",
    modules: [
      {
        title: "Module 1: The 1972 UNESCO Convention and Outstanding Universal Value",
        content: `Cultural heritage management involves the ongoing preservation of tangible and intangible cultural assets. The 1972 UNESCO World Heritage Convention remains the primary legislative framework globally. However, the designation of 'Outstanding Universal Value' (OUV) often forces a static preservation model that conflicts with the dynamic, lived realities of local indigenous populations. We will critique the Eurocentric biases in historical preservation criteria and the systemic underrepresentation of global south narratives in the World Heritage List.`
      },
      {
        title: "Module 2: Museumification of Urban Centers and Gentrification",
        content: `A core debate in urban sociology is the 'museumification' of historical city centers. When urban regeneration policies focus exclusively on aesthetic preservation for tourist consumption, the area loses its organic functionality. This gentrification displaces traditional artisans and intangible cultural practices, replacing them with homogenised souvenir commerce. Students will conduct a longitudinal spatial analysis of property values in historic districts to map the correlation between heritage designation and residential displacement.`
      },
      {
        title: "Module 3: Repatriation of Antiquities and De-colonizing Museums",
        content: `The modern museum institution is inherently tied to 19th-century colonial expansion and the controversial acquisition of ethnographic artifacts. This module tackles the legal, ethical, and logistical complexities surrounding the repatriation of cultural property. Through case studies such as the Elgin Marbles and the Benin Bronzes, we will analyze the tension between the 'universal museum' argument, which advocates for encyclopedic collections in major global hubs, versus nationalistic claims of origin and cultural restitution.`
      },
      {
        title: "Module 4: Dark Tourism and the Commodification of Trauma",
        content: `Thanatourism, or 'Dark Tourism', involves travel to sites historically associated with death, tragedy, and suffering (e.g., Auschwitz, Chernobyl, Ground Zero). This module explores the psychological motivations of dark tourists and the ethical tightrope destination managers walk between education, memorialization, and sheer voyeuristic commodification. We will assess the design of memorial spaces and the narrative frameworks used to interpret historical trauma.`
      },
      {
        title: "Module 5: Intangible Cultural Heritage (ICH) and Globalization",
        content: `Unlike physical monuments, Intangible Cultural Heritage—encompassing oral traditions, performing arts, social practices, and traditional craftsmanship—is fragile and relies entirely on human transmission. The 2003 UNESCO Convention for the Safeguarding of the Intangible Cultural Heritage attempts to catalogue these practices. However, globalization and the digital homogenization of youth culture pose severe risks to ICH transmission. We will study the interventions required to make traditional practices economically viable without degrading their authenticity.`
      }
    ]
  },
  "ECO-402": {
    title: "Advanced Macroeconomic Theories in Hospitality & Service Sectors",
    prof: "Dr. Elena Rostova",
    progress: 12,
    readTime: "7h 30m",
    modules: [
      {
        title: "Module 1: Yield Management Mathematics and Bayesian Probability",
        content: `Advanced yield management requires a profound understanding of price elasticity of demand within perishable inventory sectors. The mathematical modeling of dynamic pricing algorithms involves Bayesian probability and historical booking curve analysis. Students are required to compute the optimal overbooking ratios using the marginal cost of walked guests versus the marginal revenue of a captured booking. Complex stochastic models are utilized to predict cancellation behaviors across different market segments.`
      },
      {
        title: "Module 2: Game Theory in Oligopolistic Market Structures",
        content: `The airline and global hotel chain industries operate under strict oligopolistic conditions. Using the Nash Equilibrium and the Prisoner’s Dilemma frameworks, we will analyze predatory pricing strategies, cartel formations, and implicit collusion mechanisms. Students will construct payoff matrices to predict competitor responses to sudden capacity expansions or aggressive promotional dumping in localized markets.`
      },
      {
        title: "Module 3: Currency Fluctuations and Hedging Strategies",
        content: `For transnational service operators, foreign exchange (Forex) volatility represents a massive operational risk. This module dives into the mechanics of forward contracts, currency options, and natural hedging. We will mathematically derive the impact of a 15% depreciation in the domestic currency against the US Dollar on the cost of goods sold (COGS) for an import-reliant hospitality enterprise operating in an emerging market.`
      },
      {
        title: "Module 4: Labor Economics and the Gig Economy Paradigm",
        content: `The service sector is notoriously labor-intensive. This module explores the macroeconomic shift towards precarious employment models, zero-hour contracts, and the "Uberization" of the workforce. We will analyze the impact of minimum wage legislation shifts on overall employment levels using monopsony labor market models. The discussion will also cover the long-term productivity impacts of high turnover rates in the hospitality industry.`
      },
      {
        title: "Module 5: Investment Appraisal and Capital Budgeting Risk",
        content: `Assessing the financial viability of multi-million dollar infrastructure projects requires advanced capital budgeting techniques beyond basic NPV and IRR calculations. We will incorporate real options valuation to account for managerial flexibility in highly uncertain economic climates. Students will run Monte Carlo simulations to assess the risk profile of developing luxury resorts in politically unstable regions with high sovereign risk premiums.`
      }
    ]
  },
  "SOC-505": {
    title: "Sociology of Urban Migration and Demographic Shifts",
    prof: "Dr. Hassan Al-Fayed",
    progress: 5,
    readTime: "8h 20m",
    modules: [
      {
        title: "Module 1: Push-Pull Factors and Neoclassical Migration Theory",
        content: `Migration is rarely a monolithic event; it is driven by complex matrices of push and pull factors. From a neoclassical macroeconomic perspective, migration is simply the geographic reallocation of labor from capital-poor, labor-rich regions to capital-rich, labor-scarce regions. However, this model fails to account for structural barriers and immigration policies. We will critique the simplistic assumptions of the Harris-Todaro model in the context of contemporary rural-to-urban migration in Sub-Saharan Africa.`
      },
      {
        title: "Module 2: Remittances and the Developmental Paradox",
        content: `Global remittances often exceed foreign direct investment (FDI) and official development assistance (ODA) in developing nations. While these financial inflows reduce immediate poverty at the household level, they can also trigger a "Dutch Disease" effect—appreciating the local currency and hurting export competitiveness. We will analyze the socioeconomic reliance on remittances and whether they stimulate actual capital investment or merely fuel hyper-consumption of imported goods.`
      },
      {
        title: "Module 3: Transnationalism and Diasporic Identity Formation",
        content: `The concept of the nation-state is increasingly challenged by transnational communities who maintain dense social, economic, and political networks across borders. This module examines the role of digital communication technologies in sustaining diasporic identities. We will explore the sociological concept of 'social remittances'—the transfer of ideas, behaviors, and social capital from host to sending countries, which can drastically alter local gender norms and political expectations.`
      },
      {
        title: "Module 4: Urban Sprawl, Slum Upgrading, and Spatial Inequality",
        content: `The rapid influx of migrants into megacities often outpaces urban planning, resulting in the proliferation of informal settlements or slums. We will evaluate the sociological impact of spatial segregation, where affluent gated communities exist adjacent to impoverished, under-serviced neighborhoods. The module will critically assess policy interventions ranging from aggressive slum clearance and relocation to participatory in-situ slum upgrading programs supported by NGOs.`
      },
      {
        title: "Module 5: Climate-Induced Migration and Legal Frameworks",
        content: `As global temperatures rise, the phenomenon of the 'climate refugee' has emerged as a critical global challenge. However, current international law, specifically the 1951 Refugee Convention, does not formally recognize environmental degradation as a valid criteria for refugee status. This module explores the sociological and legal black hole faced by populations displaced by desertification, extreme flooding, and chronic drought, predicting future demographic pressures on global northern borders.`
      }
    ]
  }
};

export default function DecoyPortal({ onTriggerLogin }) {
  const [activeCourse, setActiveCourse] = useState("TOUR-304");
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery === "TOUR-404-LIVE") {
      onTriggerLogin();
    } else {
      alert(`Search Results: No new academic modules found for "${searchQuery}". Please check your syllabus or contact the central registry.`);
    }
    setSearchQuery("");
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden text-slate-800">
      
      {/* HEADER */}
      <header className="h-16 px-6 bg-[#0f172a] text-white flex justify-between items-center shadow-md z-20 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden text-slate-300 hover:text-white transition-colors">
            <Menu />
          </button>
          <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
            <GraduationCap className="text-blue-400" /> Global Studies Hub
          </h1>
        </div>
        <form onSubmit={handleSearch} className="relative w-48 md:w-64">
          <input 
            type="text" 
            placeholder="Search catalog... (e.g. TOUR-101)" 
            className="w-full px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors" 
            value={searchQuery} 
            onChange={(e) => setSearchQuery(e.target.value)} 
          />
        </form>
      </header>

      <div className="flex flex-1 overflow-hidden">
        
        {/* SIDEBAR */}
        <aside className={`${isSidebarOpen ? 'flex' : 'hidden'} md:flex flex-col w-64 bg-white border-r border-slate-200 shadow-sm z-10 shrink-0`}>
          <div className="p-6 border-b border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Session ID</p>
            <p className="text-sm font-semibold text-slate-700">Guest / Public Access</p>
            <p className="text-[10px] text-slate-400 mt-1">Read-only Permissions Active</p>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto scrollbar-hide">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              <LayoutDashboard size={18} /> Directory Home
            </button>
            <div className="pt-4 pb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">Available Modules</p>
            </div>
            
            {/* DYNAMIC COURSE LIST */}
            {Object.keys(ACADEMIC_DATA).map((courseKey) => (
              <button 
                key={courseKey}
                onClick={() => { setActiveCourse(courseKey); setActiveModuleIndex(0); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                  activeCourse === courseKey ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'
                }`}
              >
                <BookOpen size={16} className="shrink-0" /> 
                <span className="truncate text-left">{courseKey}</span>
              </button>
            ))}

            <div className="pt-6 pb-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3">Quick Links</p>
            </div>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              <FileText size={18} /> University Library
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
              <Calendar size={18} /> Academic Calendar
            </button>
          </nav>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <div className="max-w-5xl mx-auto space-y-6 pb-20">
            
            <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
              {/* Course Header Info */}
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8 border-b border-slate-100 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-600 tracking-wider uppercase mb-3">
                    <Award size={14} /> Post-Graduate Level
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 leading-tight">
                    {activeCourse}: {ACADEMIC_DATA[activeCourse].title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-slate-500 font-medium">
                    <span className="flex items-center gap-1.5"><GraduationCap size={16} className="text-slate-400" /> {ACADEMIC_DATA[activeCourse].prof}</span>
                    <span className="flex items-center gap-1.5"><Clock size={16} className="text-slate-400" /> Est. Reading: {ACADEMIC_DATA[activeCourse].readTime}</span>
                  </div>
                </div>
              </div>

              {/* Module Selection Tabs */}
              <div className="flex border-b border-slate-200 overflow-x-auto scrollbar-hide mb-8">
                {ACADEMIC_DATA[activeCourse].modules.map((mod, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveModuleIndex(idx)}
                    className={`px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-all ${
                      activeModuleIndex === idx 
                      ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    Module {idx + 1}
                  </button>
                ))}
              </div>

              {/* The Heavy Academic Text Box */}
              <div className="prose prose-slate prose-lg max-w-none">
                <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 border-l-4 border-blue-600 pl-4">
                  {ACADEMIC_DATA[activeCourse].modules[activeModuleIndex].title}
                </h2>
                
                <p className="text-slate-600 leading-loose text-justify text-[15px] md:text-[16px]">
                  {ACADEMIC_DATA[activeCourse].modules[activeModuleIndex].content}
                </p>

                {/* Extra Fake UI Elements to make it look real */}
                <div className="mt-10 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                  <h4 className="text-sm font-bold text-slate-800 mb-2 uppercase tracking-wider">Required Reading Materials</h4>
                  <ul className="space-y-2 text-sm text-slate-600 list-disc list-inside">
                    <li>Smith, J. (2024). <em>Global Macro-Trends in Policy Validation.</em> Oxford Univ. Press.</li>
                    <li>Wellington, A. (2023). <em>Statistical Models for Demographic Assessment.</em> Journal of Advanced Economics, 45(2), 112-145.</li>
                  </ul>
                  <button className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                    Download Chapter PDF (24.5 MB) →
                  </button>
                </div>

              </div>
            </div>

            {/* Fake Footer / Copyright */}
            <div className="text-center text-xs text-slate-400 mt-12">
              <p>© 2026 Global Studies Hub. Department of Advanced Academic Research.</p>
              <p>System Ver 4.2.1-stable. All analytical data is encrypted for academic integrity.</p>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}