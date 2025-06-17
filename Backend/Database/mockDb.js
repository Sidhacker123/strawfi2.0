// Mock database for persona operations
const personas = [
  {
    id: '1',
    name: 'Conservative Investor',
    description: 'Risk-averse investor focused on stable returns and capital preservation',
    risk_tolerance: 'Low',
    investment_horizon: 'Long-term',
    preferred_assets: ['Bonds', 'Blue-chip stocks', 'Dividend stocks']
  },
  {
    id: '2',
    name: 'Growth Investor',
    description: 'Investor seeking capital appreciation through growth stocks and emerging markets',
    risk_tolerance: 'High',
    investment_horizon: 'Medium-term',
    preferred_assets: ['Growth stocks', 'Tech stocks', 'Emerging markets']
  },
  {
    id: '3',
    name: 'Balanced Investor',
    description: 'Investor seeking a mix of growth and income through diversified portfolio',
    risk_tolerance: 'Medium',
    investment_horizon: 'Long-term',
    preferred_assets: ['Mixed portfolio', 'ETFs', 'Dividend stocks']
  }
];

const userPersonas = new Map();

const mockSupabase = {
  // Save user's persona selection
  async saveUserPersona(userId, persona) {
    try {
      userPersonas.set(userId, persona);
      return { success: true };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Get all available personas
  async getPersonas() {
    try {
      return { data: personas };
    } catch (error) {
      return { error: error.message };
    }
  },

  // Get a specific persona by ID
  async getPersonaById(id) {
    try {
      const persona = personas.find(p => p.id === id);
      if (!persona) {
        return { error: 'Persona not found' };
      }
      return { data: persona };
    } catch (error) {
      return { error: error.message };
    }
  }
};

module.exports = mockSupabase; 