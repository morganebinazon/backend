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

// Prompt système ultra-focalisé sur la mission paie
const getFocusedSystemPrompt = () => {
  return `Tu es PayeBot, l'assistant virtuel EXCLUSIVEMENT dédié à la simulation de paie pour l'Afrique de l'Ouest (Bénin, Togo, etc.).

## 🎯 TA MISSION UNIQUE ET STRICTE :
- Calculs de paie (salaire brut ↔ net)
- Règles fiscales et sociales (ITS, IRPP, CNSS, AMU)
- Utilisation de la plateforme PayeAfrique
- Conseils sur cotisations et charges sociales
- Formation sur la législation du travail (Bénin/Togo)

## 🚫 SUJETS INTERDITS - TU DOIS POLIMENT REFUSER :
- Culture populaire (films, musique, célébrités, sports)
- Politique générale (sauf fiscalité/paie)
- Technologie générale (sauf outils paie/RH)
- Santé/médecine (sauf congés maladie/accidents travail)
- Voyages/tourisme (sauf déplacements professionnels)
- Cuisine/recettes
- Jeux et divertissements
- Sciences générales
- Histoire générale (sauf histoire sociale/fiscale)

## 🔄 STRATÉGIE DE RECENTRAGE INTELLIGENT :
Quand on te pose une question hors-sujet :

1. **RECONNAIS** poliment la question
2. **RELIE** subtilement au domaine paie si possible
3. **REDIRIGE** fermement vers ton expertise
4. **PROPOSE** une alternative paie pertinente

### Exemples de redirection :
- "Sport" → "Intéressant ! En parlant de performance, saviez-vous que certaines entreprises offrent des primes de rendement ? Voulez-vous calculer l'impact fiscal ?"
- "Musique" → "La créativité c'est important ! D'ailleurs, les artistes au Bénin ont-ils un régime fiscal spécial ? Parlons plutôt des cotisations sociales..."
- "Films" → "Les divertissements sont importants ! Cela me fait penser aux avantages en nature. Voulez-vous simuler leur impact sur le salaire net ?"

## 🎯 MESSAGES DE RECENTRAGE TYPES :
- "C'est une question intéressante, mais je suis spécialisé uniquement dans la paie et les simulations salariales."
- "Je préfère rester dans mon domaine d'expertise : les calculs de salaire pour le Bénin et le Togo."
- "Revenons à ce que je fais de mieux : vous aider avec vos simulations de paie !"

## 💡 ADAPTATION LINGUISTIQUE INTELLIGENTE :
- Détecte automatiquement la langue (français, anglais, espagnol)
- Réponds TOUJOURS dans la langue de l'utilisateur
- Utilise la devise appropriée (XOF pour Bénin/Togo)
- Maintiens le contexte de conversation

## 📊 FORMAT SPÉCIAL POUR CALCULS :
Si tu peux effectuer un calcul de salaire :

CALCUL_RESULT: {
  "brut": montant_brut_numerique,
  "net": montant_net_calculé,
  "pays": "pays_detecté",
  "devise": "XOF_ou_autre",
  "details": "explication_courte"
}

## 🎭 PERSONNALITÉ PROFESSIONNELLE :
- Expert passionné de paie
- Pédagogue patient
- Toujours poli mais ferme sur le périmètre
- Proactif dans les suggestions paie
- Bienveillant mais focus mission

## ⚡ RÈGLE D'OR :
Chaque réponse doit soit :
1. Répondre directement à une question paie
2. Rediriger poliment vers la paie
3. Proposer un calcul ou simulation

Ne JAMAIS débattre longuement sur des sujets hors-périmètre. Redirige TOUJOURS vers ta mission principale.

EXEMPLE PARFAIT :
Utilisateur: "Qui a gagné la Coupe d'Afrique ?"
Toi: "Je ne suis pas un expert de sport, mais plutôt de paie ! 😊 En revanche, les primes de victoire des sportifs professionnels au Bénin sont-elles imposables ? Voulez-vous que nous calculions l'impact fiscal d'une prime exceptionnelle ?"`;
};

// Fonction pour détecter si une question est hors-sujet
const isOffTopicQuestion = (message) => {
  const offTopicKeywords = [
    // Culture populaire
    'film', 'movie', 'cinéma', 'acteur', 'actrice', 'netflix', 'série', 'tv',
    'musique', 'chanson', 'chanteur', 'musicien', 'album', 'concert', 'festival',
    'sport', 'football', 'basketball', 'tennis', 'coupe', 'championnat', 'équipe',
    'célébrité', 'star', 'famous', 'celebrity',
    
    // Technologie générale (hors paie)
    'smartphone', 'iphone', 'android', 'facebook', 'instagram', 'tiktok', 'twitter',
    'jeux video', 'gaming', 'playstation', 'xbox',
    
    // Autres sujets
    'météo', 'weather', 'cuisine', 'recette', 'restaurant', 'voyage', 'vacances',
    'politique générale', 'élection', 'président', 'gouvernement',
    'santé générale', 'médecin', 'maladie', 'symptôme',
    'amour', 'relation', 'mariage', 'divorce',
    'animaux', 'chat', 'chien', 'pet'
  ];

  const messageLower = message.toLowerCase();
  return offTopicKeywords.some(keyword => 
    messageLower.includes(keyword) && 
    !messageLower.includes('salaire') && 
    !messageLower.includes('paie') &&
    !messageLower.includes('travail') &&
    !messageLower.includes('emploi')
  );
};

// Fonction pour extraire et calculer automatiquement les résultats
const extractCalculationFromResponse = (response) => {
  try {
    // Chercher le pattern CALCUL_RESULT dans la réponse
    const calcPattern = /CALCUL_RESULT:\s*({[^}]+})/;
    const match = response.match(calcPattern);
    
    if (match) {
      const calcData = JSON.parse(match[1]);
      
      // Nettoyer la réponse en retirant le JSON
      const cleanResponse = response.replace(calcPattern, '').trim();
      
      return {
        hasCalculation: true,
        response: cleanResponse,
        calculation: calcData
      };
    }
    
    return {
      hasCalculation: false,
      response: response,
      calculation: null
    };
  } catch (error) {
    console.log('Erreur extraction calcul:', error);
    return {
      hasCalculation: false,
      response: response,
      calculation: null
    };
  }
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

    // 🚨 CONTRÔLE ANTI-DÉRIVE : Détecter les sujets hors-périmètre
    if (isOffTopicQuestion(message)) {
      console.log('⚠️ Question hors-sujet détectée:', message);
      
      // Ajouter un préfixe au prompt pour forcer le recentrage
      const redirectMessage = `[ATTENTION: L'utilisateur pose une question hors-sujet "${message}". Tu DOIS poliment rediriger vers la paie/simulation salariale en utilisant ta stratégie de recentrage intelligent.]

Message utilisateur: ${message}`;

      const modifiedMessage = redirectMessage;
      message = modifiedMessage; // Override du message pour forcer la redirection
    }

    try {
      // Récupérer l'historique de conversation
      const conversationHistory = getConversationHistory(sessionId);
      
      // Si c'est le premier message ou historique vide, ajouter le prompt système
      if (conversationHistory.length === 0) {
        const systemPrompt = getFocusedSystemPrompt();
        conversationHistory.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
        conversationHistory.push({
          role: 'model',
          parts: [{ text: `Bonjour ! Je suis PayeBot, votre expert dédié aux simulations de paie pour l'Afrique de l'Ouest. Je suis là pour vous aider avec vos calculs de salaire, les règles fiscales du Bénin et du Togo, et tout ce qui concerne la paie. Comment puis-je vous aider aujourd'hui ?` }]
        });
      }

      // Ajouter le nouveau message de l'utilisateur
      conversationHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Appel à l'API Gemini 2.0 Flash avec tout l'historique
      const botReply = await callGeminiAPI(conversationHistory);

      // 🔍 VÉRIFICATION FINALE : S'assurer que la réponse reste dans le périmètre
      if (isOffTopicQuestion(botReply) && !botReply.includes('paie') && !botReply.includes('salaire')) {
        console.log('⚠️ L\'IA a dévié, correction forcée');
        const forcedRedirect = `Je suis désolé, mais je suis spécialisé uniquement dans les simulations de paie pour l'Afrique de l'Ouest. Parlons plutôt de vos questions sur les salaires, les cotisations sociales, ou les règles fiscales du Bénin et du Togo. Comment puis-je vous aider avec un calcul de paie ?`;
        
        // Remplacer la réponse déviante par une redirection forcée
        conversationHistory.push({
          role: 'model',
          parts: [{ text: forcedRedirect }]
        });

        conversations.set(sessionId, conversationHistory);

        return res.json({
          reply: forcedRedirect,
          action: null,
          data: {},
          lang: 'auto'
        });
      }

      // Extraire les calculs potentiels de la réponse
      const { hasCalculation, response: cleanResponse, calculation } = extractCalculationFromResponse(botReply);

      // Ajouter la réponse du bot à l'historique (version nettoyée)
      conversationHistory.push({
        role: 'model',
        parts: [{ text: cleanResponse }]
      });

      // Sauvegarder l'historique mis à jour
      conversations.set(sessionId, conversationHistory);

      // Préparer la réponse selon qu'il y a un calcul ou non
      if (hasCalculation && calculation) {
        console.log('🧮 Calcul détecté:', calculation);
        
        const actionData = {
          reply: cleanResponse,
          action: 'display_paie_result',
          data: {
            brut: calculation.brut,
            net: calculation.net,
            pays: calculation.pays,
            devise: calculation.devise || 'XOF',
            details: calculation.details
          },
          lang: 'auto' // Laisse l'IA gérer la langue
        };

        return res.json(actionData);
      } else {
        const actionData = {
          reply: cleanResponse,
          action: null,
          data: {},
          lang: 'auto' // Laisse l'IA gérer la langue
        };

        return res.json(actionData);
      }

    } catch (geminiError) {
      console.error('❌ Erreur Gemini:', geminiError);
      
      // Fallback intelligent qui reste dans le périmètre
      const messageLower = message.toLowerCase();
      let fallbackMessage = 'Je suis PayeBot, votre assistant spécialisé dans les simulations de paie pour l\'Afrique de l\'Ouest. Comment puis-je vous aider avec vos calculs de salaire ?';
      
      // Adaptation linguistique du fallback
      if (messageLower.includes('hello') || messageLower.includes('hi')) {
        fallbackMessage = 'Hello! I am PayeBot, your payroll simulation assistant for West Africa. How can I help you with salary calculations?';
      } else if (messageLower.includes('hola') || messageLower.includes('gracias')) {
        fallbackMessage = '¡Hola! Soy PayeBot, tu asistente de simulación de nóminas para África Occidental. ¿Cómo puedo ayudarte con los cálculos salariales?';
      }

      res.json({
        reply: fallbackMessage,
        action: null,
        data: {},
        lang: 'auto'
      });
    }

  } catch (error) {
    console.error('❌ Erreur chatbot:', error);
    
    res.status(500).json({
      reply: 'Désolé, une erreur est survenue. Je suis PayeBot, votre assistant paie. Comment puis-je vous aider avec vos simulations de salaire ?',
      action: null,
      data: {},
      lang: 'auto'
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