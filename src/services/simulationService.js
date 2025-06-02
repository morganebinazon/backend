// src/services/simulationService.js

// Plus tard, ces règles viendront d'une base de données ou de fichiers de configuration par pays [cite: 14, 19, 20, 27]
const BENIN_RULES = {
  socialContributionRateEmployee: 0.036, // Exemple : 3.6% CNSS part salariale
  employerSocialContributionRate: 0.154, // Exemple : 15.4% part patronale
  // ... autres taux, barèmes IRPP pour le Bénin
  irppRates: [ // Barème IRPP simplifié pour l'exemple
    { max: 50000, rate: 0 },
    { max: 130000, rate: 0.10 }, // Jusqu'à 130000, la tranche est 10% (sur ce qui dépasse 50000)
    { max: 280000, rate: 0.15 }, // etc.
    { max: 530000, rate: 0.20 },
    { max: Infinity, rate: 0.35 },
  ],
  // ... abattements en fonction de familyStatus, childrenCount
};

const TOGO_RULES = {
  socialContributionRateEmployee: 0.04, // Exemple pour le Togo
  employerSocialContributionRate: 0.165,
  // ... autres taux, barèmes IRPP pour le Togo
  irppRates: [ /* ... barème spécifique au Togo ... */ ],
};

const calculateBrutToNet = async (params) => {
  const { grossSalary, country, familyStatus, childrenCount, otherAllowances = {} } = params;
  let rules;

  if (country.toLowerCase() === 'benin') {
    rules = BENIN_RULES;
  } else if (country.toLowerCase() === 'togo') {
    rules = TOGO_RULES;
  } else {
    throw new Error(`Les règles de calcul pour le pays '${country}' ne sont pas disponibles.`);
  }

  // 1. Calculer le salaire brut total (incluant les primes imposables)
  let totalGross = grossSalary;
  // Ici, ajoutez la logique pour les primes (certaines sont imposables, d'autres non)
  // Par exemple, si otherAllowances.transport est une prime non imposable, elle sera traitée différemment.
  // Pour cet exemple, supposons que toutes les primes dans otherAllowances sont imposables.
  for (const prime in otherAllowances) {
    totalGross += (otherAllowances[prime] || 0);
  }


  // 2. Calculer les cotisations sociales salariales
  const employeeSocialContributions = totalGross * rules.socialContributionRateEmployee;

  // 3. Calculer le salaire net imposable
  const taxableSalary = totalGross - employeeSocialContributions;
  // Ici, il faudrait aussi déduire les abattements spécifiques (ex: frais professionnels si applicables)

  // 4. Calculer l'IRPP (Impôt sur le Revenu des Personnes Physiques) - Ceci est une simplification
  // Un calcul réel d'IRPP par tranches est plus complexe et doit prendre en compte les parts fiscales (enfants, situation familiale)
  let irpp = 0;
  let remainingTaxable = taxableSalary;
  let previousMax = 0;

  // Exemple de calcul par tranches (doit être adapté précisément aux lois de chaque pays)
  for (const tranche of rules.irppRates) {
    if (remainingTaxable <= 0) break;
    const currentBracketAmount = Math.min(remainingTaxable, tranche.max - previousMax);
    irpp += currentBracketAmount * tranche.rate;
    remainingTaxable -= currentBracketAmount;
    previousMax = tranche.max;
    if (tranche.max === Infinity) break; // Pour la dernière tranche
  }
  
  // Il faut aussi appliquer les réductions d'impôt pour charges de famille (enfants, etc.) sur l'IRPP calculé.
  // Par exemple: if (childrenCount > 0) irpp = irpp * (1 - (0.05 * childrenCount)); // Simplification extrême

  // 5. Calculer le salaire net à payer
  const netSalary = taxableSalary - irpp;
  
  // 6. Calculer le coût employeur (optionnel pour cette simulation mais utile)
  const employerSocialContributions = totalGross * rules.employerSocialContributionRate;
  const totalEmployerCost = totalGross + employerSocialContributions;


  return {
    requestedGrossSalary: grossSalary,
    totalGrossSalaryWithAllowances: totalGross,
    employeeSocialContributions,
    taxableSalary,
    irpp,
    netSalaryToPay: netSalary,
    country,
    familyStatus,
    childrenCount,
    otherAllowances,
    totalEmployerCost // Coût pour l'employeur
  };
};

module.exports = {
  calculateBrutToNet,
};