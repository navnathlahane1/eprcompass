export const industryPages = [
  {
    slug: 'fmcg-consumer-brands',
    title: 'FMCG & Consumer Brands',
    navLabel: 'FMCG & Consumer Brands',
    seoTitle: 'FMCG EPR Applicability in India (2026) | EPR Compass',
    seoDescription: 'Understand current EPR applicability for FMCG and consumer brands across Plastic, Battery and related compliance streams with practical action priorities.',
    seoKeywords: ['fmcg epr compliance', 'plastic epr for consumer brands', 'pibo obligations india'],
    status: 'active',
    headline: 'High-volume packaging means high EPR exposure. Build compliance before penalties build up.',
    summary:
      'FMCG businesses typically operate across multiple plastic packaging formats and channels. EPR applicability is immediate for producers, importers and brand owners placing plastic packaging in the market.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Core applicability for PIBOs under Plastic Waste Management framework.' },
      { name: 'Used Oil EPR', applicability: 'Applicable where lubricants and oils are marketed with producer obligations.' },
      { name: 'Battery Waste EPR', applicability: 'Applicable for products sold with standalone or embedded batteries.' }
    ],
    blindSpots: [
      'Category mapping errors (CAT1/CAT2/CAT3/CAT4/EOL) across multiple SKUs.',
      'Quarterly data captured by finance format instead of CPCB filing format.',
      'Regional distributor data not reconciled into a single auditable trail.'
    ],
    actions: [
      'Create SKU-level packaging-to-category mapping and lock data ownership.',
      'Set monthly internal reconciliation before statutory filing windows.',
      'Pre-negotiate recycler/PRO capacity before peak season inventory pushes.'
    ]
  },
  {
    slug: 'ecommerce-retail',
    title: 'E-commerce & Retail',
    navLabel: 'E-commerce & Retail',
    seoTitle: 'E-commerce & Retail EPR Applicability (India) | EPR Compass',
    seoDescription: 'Map current EPR obligations for e-commerce and retail businesses across packaging, electronics and battery-linked products.',
    seoKeywords: ['ecommerce epr india', 'retail packaging compliance', 'private label epr obligations'],
    status: 'active',
    headline: 'Marketplace growth can quietly multiply EPR liability across sellers, labels and packaging layers.',
    summary:
      'Online-first brands and retail operators manage primary, secondary and tertiary packaging through distributed supply chains. EPR applicability is active where businesses operate as PIBOs or private-label brand owners.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Active applicability for packaging introduced into market across channels.' },
      { name: 'E-Waste EPR', applicability: 'Applicable where electronics are sold under own brand/private labels.' },
      { name: 'Battery Waste EPR', applicability: 'Applicable for battery-containing products and accessories.' }
    ],
    blindSpots: [
      'Seller ecosystem contracts missing clear EPR responsibility clauses.',
      'Reverse logistics data not integrated with EPR return evidence.',
      'Promotional bundle packaging not counted in annual target planning.'
    ],
    actions: [
      'Define legal accountability matrix for platform vs brand vs importer roles.',
      'Unify warehouse dispatch data and take-back documentation in one dashboard.',
      'Run quarterly target-variance checks to prevent year-end filing stress.'
    ]
  },
  {
    slug: 'electronics-eee',
    title: 'Electronics & Electrical Equipment',
    navLabel: 'Electronics & EEE',
    seoTitle: 'Electronics E-Waste EPR Applicability (India) | EPR Compass',
    seoDescription: 'See how E-Waste, Battery and packaging EPR streams apply to electronics and EEE producers/importers in India.',
    seoKeywords: ['electronics epr india', 'e-waste compliance eee', 'producer importer e-waste obligations'],
    status: 'active',
    headline: 'Electronics compliance now spans products, accessories and post-consumer collection systems.',
    summary:
      'EEE manufacturers and importers face active E-Waste EPR requirements with category-wise obligations, collection channels and authorized recycler linkages.',
    streams: [
      { name: 'E-Waste EPR', applicability: 'Primary active stream for producers and importers of electrical and electronic equipment.' },
      { name: 'Plastic Waste EPR', applicability: 'Applicable where significant plastic packaging accompanies products.' },
      { name: 'Battery Waste EPR', applicability: 'Applicable where embedded or detachable batteries are sold.' }
    ],
    blindSpots: [
      'EEE category misclassification for bundled product families.',
      'Take-back commitments not translated into measurable monthly targets.',
      'Service-center returns not reconciled with authorized recycler records.'
    ],
    actions: [
      'Build a category-accurate product master aligned to statutory categories.',
      'Establish auditable agreements with collection partners and recyclers.',
      'Track take-back by state and channel to avoid regional compliance gaps.'
    ]
  },
  {
    slug: 'battery-producers-importers',
    title: 'Battery Producers & Importers',
    navLabel: 'Battery Producers & Importers',
    seoTitle: 'Battery EPR Applicability for Producers & Importers | EPR Compass',
    seoDescription: 'Current Battery Waste EPR applicability, blind spots and action plans for producers and importers in India.',
    seoKeywords: ['battery epr india', 'battery waste compliance', 'battery producer obligations'],
    status: 'active',
    headline: 'Battery EPR is now execution-heavy: registration alone is not enough.',
    summary:
      'Battery producers and importers face active obligations around registration, collection, channel controls and evidence-backed fulfilment.',
    streams: [
      { name: 'Battery Waste EPR', applicability: 'Primary active stream with direct producer/importer obligations.' },
      { name: 'Plastic Waste EPR', applicability: 'Applicable where packaging introduction thresholds and roles are met.' },
      { name: 'E-Waste EPR', applicability: 'Applicable when batteries are sold within electronic products.' }
    ],
    blindSpots: [
      'Distributor collection promises without verifiable recovery data.',
      'Mismatch between sold units and waste return trajectory assumptions.',
      'Cross-border imports booked without aligned compliance tagging.'
    ],
    actions: [
      'Forecast return flows against sales cohorts and chemistry mix.',
      'Digitize partner declarations and proof artifacts monthly.',
      'Institute internal alerts for under-collection trends by quarter.'
    ]
  },
  {
    slug: 'tyre-manufacturers-importers',
    title: 'Tyre Manufacturers & Importers',
    navLabel: 'Tyre Manufacturers & Importers',
    seoTitle: 'Tyre EPR Applicability for Manufacturers & Importers | EPR Compass',
    seoDescription: 'Understand active tyre EPR applicability and execution priorities for tyre manufacturers and importers in India.',
    seoKeywords: ['tyre epr india', 'tyre waste obligations', 'tyre compliance producers importers'],
    status: 'active',
    headline: 'Tyre obligations are rising in operational complexity. Early traceability is the advantage.',
    summary:
      'Tyre producers and importers are under active EPR applicability with evidence-driven fulfilment and partner performance dependence.',
    streams: [
      { name: 'Tyre Waste EPR', applicability: 'Primary active stream for tyre producers and importers.' },
      { name: 'Used Oil EPR', applicability: 'Relevant for adjacent automotive lubricant portfolios.' },
      { name: 'Plastic Waste EPR', applicability: 'Applicable for packaging-linked introductions where roles apply.' }
    ],
    blindSpots: [
      'Dealer network not linked to return and channel traceability.',
      'Third-party processing claims not backed by valid documentation.',
      'No early warning when targets diverge from field realities.'
    ],
    actions: [
      'Deploy dealer-level traceability and compliance reporting cadence.',
      'Create recycler/procurement fallback options before deadline windows.',
      'Set target velocity KPIs to measure fulfilment pace monthly.'
    ]
  },
  {
    slug: 'used-oil-lubricants',
    title: 'Used Oil & Lubricants',
    navLabel: 'Used Oil & Lubricants',
    seoTitle: 'Used Oil EPR Applicability for Lubricant Businesses | EPR Compass',
    seoDescription: 'Current Used Oil EPR applicability and compliance action plans for lubricant and oil producers/importers.',
    seoKeywords: ['used oil epr india', 'lubricant compliance obligations', 'used oil producer importer rules'],
    status: 'active',
    headline: 'Used oil portfolios now require structured recovery evidence, not just declarations.',
    summary:
      'Producers and importers of base oil and lubricants face active EPR applicability with increasing scrutiny on collection and processing evidence.',
    streams: [
      { name: 'Used Oil EPR', applicability: 'Primary active stream for lubricant and oil market participants.' },
      { name: 'Plastic Waste EPR', applicability: 'Applicable for lubricant container and packaging introductions.' },
      { name: 'Tyre Waste EPR', applicability: 'Relevant for integrated mobility portfolio businesses.' }
    ],
    blindSpots: [
      'Post-sale channel fragmentation weakens traceability.',
      'Aggregator reporting lacks uniform evidence standards.',
      'Packaging and used oil obligations handled in separate silos.'
    ],
    actions: [
      'Integrate used oil and packaging EPR views in one governance rhythm.',
      'Set evidence templates for channel partners and auditors.',
      'Review contract obligations for compliance proof turnaround times.'
    ]
  },
  {
    slug: 'automotive-oem-elv',
    title: 'Automotive OEM & ELV',
    navLabel: 'Automotive OEM & ELV',
    seoTitle: 'Automotive OEM EPR & ELV Applicability | EPR Compass',
    seoDescription: 'Track current Battery, Tyre, Used Oil applicability and ELV readiness priorities for automotive OEM ecosystems.',
    seoKeywords: ['automotive epr india', 'elv compliance readiness', 'oem battery tyre used oil obligations'],
    status: 'emerging',
    headline: 'Automotive compliance is moving toward multi-stream responsibility across product life cycles.',
    summary:
      'Automotive players typically face active Battery, Tyre and Used Oil obligations today, with ELV-related frameworks evolving and expanding operational expectations.',
    streams: [
      { name: 'Battery Waste EPR', applicability: 'Active for battery-linked components and replacement ecosystems.' },
      { name: 'Tyre Waste EPR', applicability: 'Active where tyres are manufactured/imported or sold in-service chains.' },
      { name: 'Used Oil EPR', applicability: 'Active for lubricant-related producer/importer obligations.' },
      { name: 'ELV (End-of-Life Vehicle)', applicability: 'Developing landscape; monitor policy updates and prepare data architecture early.' }
    ],
    blindSpots: [
      'Aftermarket ecosystem operates outside compliance reporting structures.',
      'Warranty replacements not mapped to waste stream accountability.',
      'Policy watch is passive, delaying transition readiness.'
    ],
    actions: [
      'Build a unified multi-stream compliance command view for OEM teams.',
      'Include service network and aftermarket partners in evidence workflows.',
      'Run ELV readiness exercises before formal obligation deadlines tighten.'
    ]
  },
  {
    slug: 'construction-non-ferrous',
    title: 'Construction & Non-Ferrous Materials',
    navLabel: 'Construction & Non-Ferrous',
    seoTitle: 'Construction & Non-Ferrous EPR Applicability | EPR Compass',
    seoDescription: 'Emerging applicability guidance for construction and non-ferrous materials businesses with practical compliance readiness actions.',
    seoKeywords: ['construction epr india', 'non ferrous compliance', 'emerging epr applicability sectors'],
    status: 'emerging',
    headline: 'Construction and non-ferrous value chains are entering tighter circularity and producer accountability cycles.',
    summary:
      'This segment is seeing growing compliance expectations with active obligations for packaging-linked introductions and emerging frameworks for broader waste responsibility.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Active where packaging obligations apply to products sold in market.' },
      { name: 'Construction & Demolition EPR', applicability: 'Emerging applicability area; businesses should prepare reporting-ready systems.' },
      { name: 'Non-Ferrous Materials EPR', applicability: 'Emerging scope with increasing compliance planning importance.' }
    ],
    blindSpots: [
      'Project-based dispatch records not structured for compliance evidence.',
      'Material recovery tracking handled by vendors without audit-ready outputs.',
      'No unified owner for emerging EPR preparedness.'
    ],
    actions: [
      'Set up early governance and accountability for emerging waste streams.',
      'Standardize vendor evidence formats before policy hardening.',
      'Pilot reporting structures now to reduce future transition costs.'
    ]
  },
  {
    slug: 'pharmaceuticals-healthcare',
    title: 'Pharmaceuticals & Healthcare',
    navLabel: 'Pharmaceuticals & Healthcare',
    seoTitle: 'Pharmaceutical EPR Applicability in India | EPR Compass',
    seoDescription: 'Current EPR applicability for pharmaceutical and healthcare businesses across packaging, battery-linked devices and channel controls.',
    seoKeywords: ['pharma epr india', 'healthcare packaging compliance', 'pharmaceutical producer obligations'],
    status: 'active',
    headline: 'Healthcare brands are trusted on safety. EPR performance now shapes that trust as much as product quality.',
    summary:
      'Pharmaceutical and healthcare companies face active packaging-related obligations, with battery-linked applicability where medical devices and diagnostics are part of the portfolio.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Active applicability for packaging introduced by producers/importers/brand owners.' },
      { name: 'Battery Waste EPR', applicability: 'Applicable for diagnostics, portable devices and battery-backed equipment categories.' },
      { name: 'E-Waste EPR', applicability: 'Applicable where electronic healthcare products are placed in market.' }
    ],
    blindSpots: [
      'Hospital and distributor packaging footprints not consolidated centrally.',
      'Device accessory batteries excluded from obligation planning.',
      'Compliance ownership split between regulatory and operations teams with no shared cadence.'
    ],
    actions: [
      'Map each product family to packaging and device-linked streams.',
      'Create evidence-ready monthly reporting from channel partners.',
      'Run joint governance between quality, regulatory and sustainability teams.'
    ]
  },
  {
    slug: 'cosmetics-personal-care',
    title: 'Cosmetics & Personal Care',
    navLabel: 'Cosmetics & Personal Care',
    seoTitle: 'Cosmetics EPR Applicability in India | EPR Compass',
    seoDescription: 'Current EPR applicability for cosmetics and personal care brands with packaging-heavy portfolios and omnichannel distribution.',
    seoKeywords: ['cosmetics epr india', 'personal care packaging compliance', 'brand owner epr obligations'],
    status: 'active',
    headline: 'Brand-led categories depend on packaging quality. That same packaging is now your core EPR risk surface.',
    summary:
      'Cosmetics and personal care portfolios are typically packaging-intensive, making Plastic Waste EPR actively applicable for most brand owner and importer models.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Primary active stream for primary and secondary packaging introductions.' },
      { name: 'Used Oil EPR', applicability: 'Relevant for brands with oils and specialty formulations in scope.' },
      { name: 'Battery Waste EPR', applicability: 'Applicable for electronic beauty tools sold with batteries.' }
    ],
    blindSpots: [
      'Gift packs and seasonal bundles not included in annual target estimates.',
      'Contract manufacturing data arrives late or in non-filing formats.',
      'Marketplace and offline channels maintain separate compliance records.'
    ],
    actions: [
      'Build campaign-season packaging projections before launch cycles.',
      'Enforce standardized partner templates for monthly quantity reporting.',
      'Create one compliance ledger across D2C, retail and marketplace channels.'
    ]
  },
  {
    slug: 'food-beverage-processing',
    title: 'Food & Beverage Processing',
    navLabel: 'Food & Beverage Processing',
    seoTitle: 'Food & Beverage EPR Applicability in India | EPR Compass',
    seoDescription: 'Understand current EPR applicability for food and beverage businesses with high packaging velocity and distributed channels.',
    seoKeywords: ['food beverage epr india', 'packaging compliance food brands', 'fmcg packaging obligations'],
    status: 'active',
    headline: 'In high-frequency consumption categories, small packaging errors become large compliance liabilities quickly.',
    summary:
      'Food and beverage businesses usually carry immediate Plastic Waste EPR applicability due to high packaging throughput and widespread distribution footprints.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Primary active stream for packaged food and beverage portfolios.' },
      { name: 'Used Oil EPR', applicability: 'Applicable where edible/industrial oil producer obligations are triggered by role and category.' },
      { name: 'Battery Waste EPR', applicability: 'Relevant for battery-powered beverage/dispensing equipment portfolios.' }
    ],
    blindSpots: [
      'Distributor-level secondary packaging not attributed correctly.',
      'Regional co-packers report data on delayed or non-uniform cadence.',
      'No escalation trigger when channel returns lag target trajectory.'
    ],
    actions: [
      'Track packaging quantities by state, channel and product class monthly.',
      'Integrate co-packer and distributor data into one reporting pipeline.',
      'Implement quarterly risk alerts for under-fulfilment segments.'
    ]
  },
  {
    slug: 'textiles-apparel-footwear',
    title: 'Textiles, Apparel & Footwear',
    navLabel: 'Textiles, Apparel & Footwear',
    seoTitle: 'Textile & Footwear EPR Applicability | EPR Compass',
    seoDescription: 'Current EPR applicability for textile, apparel and footwear businesses, including packaging and emerging circularity frameworks.',
    seoKeywords: ['textile epr india', 'footwear packaging compliance', 'apparel brand owner obligations'],
    status: 'emerging',
    headline: 'Apparel growth is fast. Compliance maturity must grow faster to prevent downstream disruption.',
    summary:
      'Textile and footwear players usually have active packaging obligations today, with broader circularity and material responsibility expectations tightening over time.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Active applicability for polybags, protective films and shipping materials.' },
      { name: 'Non-Ferrous / Material EPR', applicability: 'Emerging applicability for material-intensive product ecosystems.' },
      { name: 'Battery Waste EPR', applicability: 'Applicable where smart wearables/accessories are sold with batteries.' }
    ],
    blindSpots: [
      'Packaging at warehouse and fulfillment layer left out of disclosures.',
      'Imported accessories not mapped to waste-stream applicability.',
      'Compliance planning deferred because core obligation looks "only packaging".'
    ],
    actions: [
      'Include warehouse and return-packaging in obligation accounting.',
      'Audit imported SKUs for hidden stream applicability.',
      'Build an annual roadmap combining active and emerging obligations.'
    ]
  },
  {
    slug: 'white-goods-home-appliances',
    title: 'White Goods & Home Appliances',
    navLabel: 'White Goods & Home Appliances',
    seoTitle: 'Home Appliances EPR Applicability (India) | EPR Compass',
    seoDescription: 'Track E-Waste, Battery and packaging applicability for home appliance manufacturers, importers and brand owners.',
    seoKeywords: ['home appliances epr india', 'white goods e-waste compliance', 'appliance producer obligations'],
    status: 'active',
    headline: 'Appliance brands operate across product, packaging and accessory streams. Compliance must mirror that complexity.',
    summary:
      'Home appliance businesses generally face active E-Waste and packaging obligations, with battery-related applicability for relevant product categories.',
    streams: [
      { name: 'E-Waste EPR', applicability: 'Primary active stream for electrical/electronic appliance portfolios.' },
      { name: 'Plastic Waste EPR', applicability: 'Active for transport and retail packaging introduced in market.' },
      { name: 'Battery Waste EPR', applicability: 'Applicable for battery-dependent appliance segments and accessories.' }
    ],
    blindSpots: [
      'Accessory kits and bundled products create misclassification risk.',
      'After-sales replacements are not always tied to compliance ledgers.',
      'Collection channel performance is tracked commercially, not for evidence.'
    ],
    actions: [
      'Create SKU and accessory level stream-mapping governance.',
      'Align service-center returns with recycler evidence workflows.',
      'Monitor channel performance against regulatory targets monthly.'
    ]
  },
  {
    slug: 'telecom-it-hardware',
    title: 'Telecom & IT Hardware',
    navLabel: 'Telecom & IT Hardware',
    seoTitle: 'Telecom & IT Hardware EPR Applicability | EPR Compass',
    seoDescription: 'Current EPR applicability for telecom and IT hardware providers across E-Waste, Battery and packaging streams.',
    seoKeywords: ['telecom epr india', 'it hardware e-waste compliance', 'battery epr telecom devices'],
    status: 'active',
    headline: 'Device-heavy portfolios move quickly. Compliance lag in one segment can create enterprise-scale risk.',
    summary:
      'Telecom and IT hardware businesses face active E-Waste applicability with companion obligations across batteries and packaging for most product lines.',
    streams: [
      { name: 'E-Waste EPR', applicability: 'Core active stream for telecom and IT equipment producers/importers.' },
      { name: 'Battery Waste EPR', applicability: 'Active for battery-backed devices, routers, handhelds and accessories.' },
      { name: 'Plastic Waste EPR', applicability: 'Applicable for packaging introduced via B2B and retail channels.' }
    ],
    blindSpots: [
      'Enterprise and retail channels maintain separate return data quality.',
      'Refurbishment loops not integrated into formal compliance reporting.',
      'Imported peripheral devices bypass stream-level mapping controls.'
    ],
    actions: [
      'Unify B2B and retail stream reporting into one audit trail.',
      'Tag refurbish/repair pathways with compliance evidence checkpoints.',
      'Review import catalogs quarterly for newly applicable categories.'
    ]
  },
  {
    slug: 'solar-renewable-energy-equipment',
    title: 'Solar & Renewable Energy Equipment',
    navLabel: 'Solar & Renewable Energy Equipment',
    seoTitle: 'Solar Equipment EPR Applicability in India | EPR Compass',
    seoDescription: 'Understand current and emerging EPR applicability for solar and renewable energy equipment value chains.',
    seoKeywords: ['solar epr india', 'renewable equipment compliance', 'battery e-waste solar obligations'],
    status: 'emerging',
    headline: 'Renewable scale-up creates long-tail waste responsibility. Planning early is cheaper than correcting late.',
    summary:
      'Solar and renewable equipment portfolios often intersect with active battery/electronic streams and emerging framework expectations for lifecycle accountability.',
    streams: [
      { name: 'Battery Waste EPR', applicability: 'Active where storage systems and battery packs are sold or imported.' },
      { name: 'E-Waste EPR', applicability: 'Applicable for electronic control systems and associated hardware.' },
      { name: 'Material/Panel End-of-Life', applicability: 'Emerging compliance expectations; track policy and build early readiness.' }
    ],
    blindSpots: [
      'Long lifecycle assumptions delay compliance architecture investments.',
      'Project EPC ecosystems lack standard evidence formats.',
      'Field replacements are not linked to producer responsibility tracking.'
    ],
    actions: [
      'Build future-proof asset and replacement traceability now.',
      'Define EPC and O&M partner reporting obligations contractually.',
      'Run annual policy watch and readiness-gap assessments.'
    ]
  },
  {
    slug: 'chemicals-industrial-manufacturing',
    title: 'Chemicals & Industrial Manufacturing',
    navLabel: 'Chemicals & Industrial Manufacturing',
    seoTitle: 'Chemical & Industrial EPR Applicability | EPR Compass',
    seoDescription: 'Current EPR applicability for chemical and industrial manufacturers with packaging, oil and material-flow obligations.',
    seoKeywords: ['chemical industry epr india', 'industrial packaging compliance', 'used oil obligations manufacturing'],
    status: 'active',
    headline: 'Industrial portfolios are complex by default. Compliance systems must be engineered, not improvised.',
    summary:
      'Chemical and industrial manufacturers usually face active packaging and used-oil related obligations, with additional stream intersections based on product lines.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Active for packaging and container materials introduced into market.' },
      { name: 'Used Oil EPR', applicability: 'Active where lubricants/oils are part of producer/importer portfolios.' },
      { name: 'Battery/E-Waste EPR', applicability: 'Applicable where industrial electronics and battery systems are sold.' }
    ],
    blindSpots: [
      'B2B dispatch systems do not map directly to filing categories.',
      'Shared plants produce multi-brand outputs without clean attribution.',
      'Compliance evidence workflows are treated as annual, not continuous.'
    ],
    actions: [
      'Create product-to-stream mapping at plant and brand level.',
      'Establish attribution controls for shared manufacturing lines.',
      'Shift from annual evidence collation to monthly controls.'
    ]
  },
  {
    slug: 'packaging-converters-manufacturers',
    title: 'Packaging Converters & Manufacturers',
    navLabel: 'Packaging Converters & Manufacturers',
    seoTitle: 'Packaging Converter EPR Applicability | EPR Compass',
    seoDescription: 'Current EPR applicability for packaging converters and manufacturers working across multiple resin and category formats.',
    seoKeywords: ['packaging converter epr india', 'plastic category mapping compliance', 'pibo packaging obligations'],
    status: 'active',
    headline: 'Converters sit at the center of category accuracy. Upstream precision prevents downstream penalties.',
    summary:
      'Packaging converters and manufacturers are critical to active Plastic EPR execution, especially category mapping quality and data reliability for brand owners.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Primary active stream; category precision directly impacts producer disclosures.' },
      { name: 'Non-Ferrous/Composite Material Streams', applicability: 'Emerging where multi-material formats and notifications expand scope.' },
      { name: 'Used Oil / Specialty Inputs', applicability: 'Relevant based on product and material process roles.' }
    ],
    blindSpots: [
      'Material substitutions not reflected in category declarations quickly enough.',
      'Customer-wise allocations are estimated instead of evidence-backed.',
      'No control point for EOL and difficult-to-recycle format disclosures.'
    ],
    actions: [
      'Digitize formulation-to-category change controls.',
      'Provide customer-level monthly compliance data packs.',
      'Flag high-risk material formats early for redesign decisions.'
    ]
  },
  {
    slug: 'hospitality-institutional-procurement',
    title: 'Hospitality & Institutional Procurement',
    navLabel: 'Hospitality & Institutional Procurement',
    seoTitle: 'Hospitality EPR Applicability & Procurement Risk | EPR Compass',
    seoDescription: 'Understand active and indirect EPR applicability drivers for hospitality and institutional procurement-heavy operations.',
    seoKeywords: ['hospitality epr india', 'institutional procurement compliance', 'packaging and waste obligations'],
    status: 'emerging',
    headline: 'Large procurement footprints create indirect compliance exposure. Vendor governance is now a strategic control.',
    summary:
      'Hospitality and institutional operators may carry direct obligations in some portfolios and significant indirect risk through supplier and packaging ecosystems.',
    streams: [
      { name: 'Plastic Waste EPR', applicability: 'Active where own-brand or directly introduced packaging falls under producer/importer/brand-owner roles.' },
      { name: 'Used Oil EPR', applicability: 'Relevant for entities introducing applicable oil/lubricant products under own responsibility.' },
      { name: 'Battery/E-Waste Streams', applicability: 'Applicable where electronic assets and batteries are sold, imported or branded within scope.' }
    ],
    blindSpots: [
      'Vendor contracts do not define EPR data and evidence obligations.',
      'Own-label products are treated as pure procurement, not producer responsibility.',
      'No centralized policy watch for changing applicability thresholds.'
    ],
    actions: [
      'Classify own-label vs third-party procurement responsibility clearly.',
      'Add compliance evidence clauses and reporting SLAs in vendor contracts.',
      'Set quarterly applicability review for legal, procurement and sustainability teams.'
    ]
  }
];

export function getIndustryBySlug(slug) {
  return industryPages.find((item) => item.slug === slug);
}

