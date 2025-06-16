import axios from 'axios';

// Vérification de la clé API
if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY n\'est pas définie dans les variables d\'environnement');
  process.exit(1);
}

console.log('✅ GEMINI_API_KEY trouvée:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');

// Configuration pour l'API Gemini 2.0 Flash
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

// Stockage des conversations en mémoire (pour maintenir le contexte)
const conversations = new Map();

// Fonction pour appeler l'API Gemini 2.0 Flash directement
const callGeminiAPI = async (conversationHistory) => {
  try {
    console.log('🚀 Appel à l\'API Gemini 2.0 Flash avec historique...');
    
    const requestBody = {
      contents: conversationHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
      }
    };

    const response = await axios.post(GEMINI_API_URL, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 secondes de timeout
    });

    if (response.data && response.data.candidates && response.data.candidates.length > 0) {
      const textContent = response.data.candidates[0].content.parts[0].text;
      console.log('✅ Réponse Gemini reçue');
      return textContent;
    } else {
      throw new Error('Format de réponse inattendu de l\'API Gemini');
    }
    
  } catch (error) {
    console.error('❌ Erreur API Gemini:', error.response?.data || error.message);
    throw error;
  }
};

// Fonction améliorée pour détecter la langue du message
const detectLanguage = (text) => {
  // Mots clés français (élargi et amélioré)
  const frenchKeywords = [
    'bonjour', 'bonsoir', 'salut', 'coucou', 'bonne', 'merci', 'comment', 'pourquoi', 
    'que', 'qui', 'où', 'quand', 'combien', 'quel', 'quelle', 'je', 'tu', 'il', 'elle', 
    'nous', 'vous', 'ils', 'elles', 'un', 'une', 'le', 'la', 'les', 'de', 'du', 'des', 
    'à', 'au', 'aux', 'pour', 'avec', 'sans', 'sur', 'sous', 'dans', 'par', 'ça', 
    'oui', 'non', 'français', 'francais', 'parle', 'parler', 'aide', 'aider', 
    'calcul', 'calculer', 'salaire', 'paie', 'benin', 'bénin', 'togo', 'puis'
  ];
  
  // Mots clés anglais
  const englishKeywords = [
    'hello', 'hi', 'good', 'thank', 'thanks', 'how', 'why', 'what', 'who', 'where', 
    'when', 'which', 'i', 'you', 'he', 'she', 'we', 'they', 'a', 'an', 'the', 'of', 
    'to', 'for', 'with', 'without', 'on', 'in', 'by', 'yes', 'no', 'english', 
    'speak', 'help', 'calculate', 'salary', 'payroll', 'benin', 'togo', 'can'
  ];
  
  // Mots clés espagnols
  const spanishKeywords = [
    'hola', 'buenas', 'gracias', 'cómo', 'por qué', 'qué', 'quién', 'dónde', 'cuándo', 
    'cuánto', 'yo', 'tú', 'él', 'ella', 'nosotros', 'vosotros', 'ellos', 'ellas', 
    'un', 'una', 'el', 'la', 'los', 'las', 'de', 'del', 'para', 'con', 'sin', 'en', 
    'por', 'sí', 'no', 'español', 'habla', 'hablar', 'ayuda', 'ayudar', 'calcular', 
    'salario', 'nómina', 'benín', 'togo', 'puede'
  ];

  const textLower = text.toLowerCase();
  
  let frenchScore = 0;
  let englishScore = 0;
  let spanishScore = 0;

  // Comptage avec pondération pour les mots plus spécifiques
  frenchKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      // Mots très spécifiques au français
      if (['bonsoir', 'bonjour', 'français', 'francais', 'benin', 'bénin'].includes(keyword)) {
        frenchScore += 3;
      } else {
        frenchScore += 1;
      }
    }
  });

  englishKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      // Mots très spécifiques à l'anglais
      if (['hello', 'english', 'speak'].includes(keyword)) {
        englishScore += 3;
      } else {
        englishScore += 1;
      }
    }
  });

  spanishKeywords.forEach(keyword => {
    if (textLower.includes(keyword)) {
      // Mots très spécifiques à l'espagnol
      if (['hola', 'español', 'hablar', 'benín'].includes(keyword)) {
        spanishScore += 3;
      } else {
        spanishScore += 1;
      }
    }
  });

  console.log(`🔍 Scores de langue - FR: ${frenchScore}, EN: ${englishScore}, ES: ${spanishScore}`);

  if (frenchScore > englishScore && frenchScore > spanishScore) return 'fr';
  if (englishScore > spanishScore) return 'en';
  return 'es';
};

// Fonction pour créer le prompt système selon la langue
const getSystemPrompt = (lang) => {
  const prompts = {
    fr: `Tu es un assistant virtuel expert en simulation de paie pour les pays d'Afrique de l'Ouest (Bénin, Togo, etc.).

Ton rôle est d'aider les utilisateurs avec :
- Les calculs de paie (salaire brut vers net)
- Les règles fiscales et sociales
- L'utilisation de la plateforme de simulation
- Les questions sur les cotisations et charges

Instructions CRUCIALES :
- Tu DOIS ABSOLUMENT répondre en français uniquement
- Même si l'utilisateur écrit en anglais, réponds toujours en français
- Sois précis et professionnel
- Si on te demande un calcul de paie, demande le montant brut et le pays
- Pour le Bénin : charges sociales ~15%, impôts progressifs
- Pour le Togo : charges sociales ~12%, impôts progressifs
- Fournis des exemples concrets
- Si tu ne connais pas une règle spécifique, recommande de consulter un expert

IMPORTANT : Réponds uniquement en français, pas d'autres langues !`,

    en: `You are a virtual assistant expert in payroll simulation for West African countries (Benin, Togo, etc.).

Your role is to help users with:
- Payroll calculations (gross to net salary)
- Tax and social rules
- Platform usage
- Questions about contributions and charges

CRUCIAL instructions:
- You MUST respond in English only
- Even if the user writes in French or Spanish, always respond in English
- Be precise and professional
- If asked for payroll calculation, request gross amount and country
- For Benin: social charges ~15%, progressive taxes
- For Togo: social charges ~12%, progressive taxes
- Provide concrete examples
- If you don't know a specific rule, recommend consulting an expert

IMPORTANT: Respond only in English, no other languages!`,

    es: `Eres un asistente virtual experto en simulación de nóminas para países de África Occidental (Benín, Togo, etc.).

Tu función es ayudar a los usuarios con:
- Cálculos de nómina (salario bruto a neto)
- Reglas fiscales y sociales
- Uso de la plataforma
- Preguntas sobre cotizaciones y cargas

Instrucciones CRUCIALES:
- DEBES responder únicamente en español
- Incluso si el usuario escribe en francés o inglés, siempre responde en español
- Sé preciso y profesional
- Si te piden un cálculo de nómina, pide el monto bruto y el país
- Para Benín: cargas sociales ~15%, impuestos progresivos
- Para Togo: cargas sociales ~12%, impuestos progresivos
- Proporciona ejemplos concretos
- Si no conoces una regla específica, recomienda consultar un experto

IMPORTANTE: ¡Responde solo en español, no en otros idiomas!`
  };

  return prompts[lang] || prompts.fr;
};

// Fonction pour calculer le salaire net (simulation simplifiée)
const calculateNetSalary = (brut, pays) => {
  let chargesSociales = 0;
  let impots = 0;

  if (pays.toLowerCase().includes('benin') || pays.toLowerCase().includes('bénin')) {
    chargesSociales = brut * 0.15; // 15% charges sociales
    const salaireTaxable = brut - chargesSociales;
    
    // Calcul impôt progressif simplifié pour le Bénin
    if (salaireTaxable <= 30000) {
      impots = 0;
    } else if (salaireTaxable <= 50000) {
      impots = (salaireTaxable - 30000) * 0.10;
    } else if (salaireTaxable <= 80000) {
      impots = 20000 * 0.10 + (salaireTaxable - 50000) * 0.15;
    } else {
      impots = 20000 * 0.10 + 30000 * 0.15 + (salaireTaxable - 80000) * 0.20;
    }
  } else if (pays.toLowerCase().includes('togo')) {
    chargesSociales = brut * 0.12; // 12% charges sociales
    const salaireTaxable = brut - chargesSociales;
    
    // Calcul impôt progressif simplifié pour le Togo
    if (salaireTaxable <= 25000) {
      impots = 0;
    } else if (salaireTaxable <= 45000) {
      impots = (salaireTaxable - 25000) * 0.12;
    } else if (salaireTaxable <= 75000) {
      impots = 20000 * 0.12 + (salaireTaxable - 45000) * 0.18;
    } else {
      impots = 20000 * 0.12 + 30000 * 0.18 + (salaireTaxable - 75000) * 0.25;
    }
  }

  const net = brut - chargesSociales - impots;
  return Math.round(net);
};

// Fonction pour obtenir un ID de session (ici simplifié avec l'IP)
const getSessionId = (req) => {
  return req.ip || req.connection.remoteAddress || 'default';
};

// Fonction pour gérer l'historique de conversation
const getConversationHistory = (sessionId) => {
  if (!conversations.has(sessionId)) {
    conversations.set(sessionId, []);
  }
  return conversations.get(sessionId);
};

const addToConversationHistory = (sessionId, role, content) => {
  const history = getConversationHistory(sessionId);
  history.push({
    role: role,
    parts: [{ text: content }]
  });
  
  // Limiter l'historique à 20 messages (10 échanges)
  if (history.length > 20) {
    history.splice(0, history.length - 20);
  }
  
  conversations.set(sessionId, history);
};

// Contrôleur principal du chatbot
export const chatbot = async (req, res) => {
  try {
    const { message } = req.body;
    const sessionId = getSessionId(req);

    console.log('📩 Message reçu:', message);
    console.log('🔑 Session ID:', sessionId);

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message requis et doit être une chaîne de caractères'
      });
    }

    // Détection de la langue
    const detectedLang = detectLanguage(message);
    console.log('🌍 Langue détectée:', detectedLang);

    // Vérification des patterns pour calcul de paie avec extraction automatique
    const messageLower = message.toLowerCase();
    const salaryPattern = /(\d+(?:[\s,.]?\d+)*).*(benin|bénin|togo)/i;
    const salaryMatch = message.match(salaryPattern);
    
    // Si c'est un calcul de salaire et qu'on a les infos nécessaires
    if (salaryMatch && (messageLower.includes('calcul') || messageLower.includes('salaire') || messageLower.includes('paie') || messageLower.includes('calculate') || messageLower.includes('salary'))) {
      const brutAmount = parseInt(salaryMatch[1].replace(/[\s,.]/g, ''));
      const country = salaryMatch[2].toLowerCase();
      const netAmount = calculateNetSalary(brutAmount, country);
      
      const calculationMessages = {
        fr: `Voici le calcul de votre salaire pour ${country.charAt(0).toUpperCase() + country.slice(1)} :`,
        en: `Here is your salary calculation for ${country.charAt(0).toUpperCase() + country.slice(1)}:`,
        es: `Aquí está el cálculo de su salario para ${country.charAt(0).toUpperCase() + country.slice(1)}:`
      };
      
      const responseText = calculationMessages[detectedLang] || calculationMessages.fr;
      
      // Ajouter à l'historique
      addToConversationHistory(sessionId, 'user', message);
      addToConversationHistory(sessionId, 'model', responseText);
      
      const actionData = {
        reply: responseText,
        action: 'display_paie_result',
        data: {
          brut: brutAmount,
          net: netAmount,
          pays: country
        },
        lang: detectedLang
      };

      return res.json(actionData);
    }

    // Sinon, appeler l'API Gemini pour une réponse intelligente avec contexte
    try {
      // Récupérer l'historique de conversation
      const conversationHistory = getConversationHistory(sessionId);
      
      // Si c'est le premier message ou historique vide, ajouter le prompt système
      if (conversationHistory.length === 0) {
        const systemPrompt = getSystemPrompt(detectedLang);
        conversationHistory.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
        conversationHistory.push({
          role: 'model',
          parts: [{ text: `Je suis votre assistant pour la simulation de paie. Comment puis-je vous aider ?` }]
        });
      }

      // Ajouter le nouveau message de l'utilisateur
      conversationHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Appel à l'API Gemini 2.0 Flash avec tout l'historique
      const botReply = await callGeminiAPI(conversationHistory);

      // Ajouter la réponse du bot à l'historique
      conversationHistory.push({
        role: 'model',
        parts: [{ text: botReply }]
      });

      // Sauvegarder l'historique mis à jour
      conversations.set(sessionId, conversationHistory);

      const actionData = {
        reply: botReply,
        action: null,
        data: {},
        lang: detectedLang
      };

      res.json(actionData);

    } catch (geminiError) {
      console.error('❌ Erreur Gemini:', geminiError);
      
      // Fallback avec une réponse basique
      const fallbackMessages = {
        fr: 'Je suis votre assistant pour la simulation de paie. Comment puis-je vous aider avec vos calculs de salaire ?',
        en: 'I am your assistant for payroll simulation. How can I help you with your salary calculations?',
        es: 'Soy tu asistente para la simulación de nóminas. ¿Cómo puedo ayudarte con tus cálculos de salario?'
      };

      res.json({
        reply: fallbackMessages[detectedLang] || fallbackMessages.fr,
        action: null,
        data: {},
        lang: detectedLang
      });
    }

  } catch (error) {
    console.error('❌ Erreur chatbot:', error);
    
    const errorMessages = {
      fr: 'Désolé, une erreur est survenue. Veuillez réessayer.',
      en: 'Sorry, an error occurred. Please try again.',
      es: 'Lo siento, ocurrió un error. Por favor, inténtalo de nuevo.'
    };
    
    res.status(500).json({
      reply: errorMessages.fr,
      action: null,
      data: {},
      lang: 'fr'
    });
  }
};

// Contrôleur pour obtenir l'historique des conversations
export const getChatHistory = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    const history = getConversationHistory(sessionId);
    
    res.json({
      message: 'Historique des conversations',
      history: history,
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Erreur récupération historique:', error);
    res.status(500).json({
      error: 'Erreur lors de la récupération de l\'historique'
    });
  }
};

// Contrôleur pour effacer l'historique d'une session
export const clearHistory = async (req, res) => {
  try {
    const sessionId = getSessionId(req);
    conversations.delete(sessionId);
    
    res.json({
      message: 'Historique effacé avec succès',
      sessionId: sessionId
    });
  } catch (error) {
    console.error('Erreur effacement historique:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'effacement de l\'historique'
    });
  }
};