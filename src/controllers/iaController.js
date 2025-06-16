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

// Prompt système intelligent qui laisse l'IA décider
const getSmartSystemPrompt = () => {
  return `Tu es un assistant virtuel expert en simulation de paie pour les pays d'Afrique de l'Ouest, particulièrement le Bénin et le Togo.

## RÔLE ET COMPÉTENCES :
- Expert en calculs de paie (salaire brut vers net)
- Connaissance des règles fiscales et sociales de la région
- Assistance sur l'utilisation des plateformes de simulation
- Conseils sur les cotisations et charges sociales

## INTELLIGENCE CONTEXTUELLE :
- Détecte automatiquement la langue de l'utilisateur (français, anglais, espagnol)
- Réponds TOUJOURS dans la même langue que l'utilisateur
- Si l'utilisateur change de langue, adapte-toi immédiatement
- Utilise la devise appropriée selon le pays mentionné :
  * Bénin/Togo = Franc CFA (XOF) 
  * Autres pays = selon le contexte

## RÈGLES FISCALES (à appliquer intelligemment) :
- **Bénin** : charges sociales ~15%, impôts progressifs (0% jusqu'à 30K XOF, puis 10%, 15%, 20%)
- **Togo** : charges sociales ~12%, impôts progressifs (0% jusqu'à 25K XOF, puis 12%, 18%, 25%)

## INSTRUCTIONS DE RÉPONSE :
1. Adapte automatiquement ta langue à celle de l'utilisateur
2. Sois précis et professionnel
3. Pour les calculs de paie, demande le montant brut et le pays si manquants
4. Utilise le format de devise approprié (XOF pour Bénin/Togo)
5. Fournis des exemples concrets adaptés au contexte
6. Si tu détectes un calcul de salaire possible, propose de l'effectuer

## FORMAT DE RÉPONSE SPÉCIAL POUR CALCULS :
Si tu peux effectuer un calcul de salaire, utilise ce format JSON à la fin de ta réponse :

CALCUL_RESULT: {
  "brut": montant_brut_numerique,
  "net": montant_net_calculé,
  "pays": "pays_detecté",
  "devise": "XOF_ou_autre",
  "details": "explication_courte"
}

## PERSONNALITÉ :
- Amical et professionnel
- Patient et pédagogue
- S'adapte au niveau de l'utilisateur
- Proactif dans les suggestions

Souviens-toi de ton historique de conversation et maintiens la cohérence linguistique avec l'utilisateur.`;
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

    try {
      // Récupérer l'historique de conversation
      const conversationHistory = getConversationHistory(sessionId);
      
      // Si c'est le premier message ou historique vide, ajouter le prompt système
      if (conversationHistory.length === 0) {
        const systemPrompt = getSmartSystemPrompt();
        conversationHistory.push({
          role: 'user',
          parts: [{ text: systemPrompt }]
        });
        conversationHistory.push({
          role: 'model',
          parts: [{ text: `Je suis votre assistant intelligent pour la simulation de paie. Je m'adapte automatiquement à votre langue et au contexte de votre région. Comment puis-je vous aider ?` }]
        });
      }

      // Ajouter le nouveau message de l'utilisateur
      conversationHistory.push({
        role: 'user',
        parts: [{ text: message }]
      });

      // Appel à l'API Gemini 2.0 Flash avec tout l'historique
      const botReply = await callGeminiAPI(conversationHistory);

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
      
      // Fallback intelligent qui s'adapte au message de l'utilisateur
      let fallbackMessage = 'Je suis votre assistant pour la simulation de paie. Comment puis-je vous aider ?';
      
      // Détection basique pour le fallback
      const messageLower = message.toLowerCase();
      if (messageLower.includes('hello') || messageLower.includes('hi')) {
        fallbackMessage = 'Hello! I am your payroll simulation assistant. How can I help you?';
      } else if (messageLower.includes('hola') || messageLower.includes('gracias')) {
        fallbackMessage = '¡Hola! Soy tu asistente de simulación de nóminas. ¿Cómo puedo ayudarte?';
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
      reply: 'Désolé, une erreur est survenue. Veuillez réessayer.',
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