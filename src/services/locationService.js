const stateModel = require('../models/stateModel');
const cityModel = require('../models/cityModel');

class LocationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

const resolveStateCity = async (stateId, cityId) => {
  if (!stateId || !cityId) {
    throw new LocationError('state_id and city_id are required');
  }

  const state = await stateModel.getActiveById(stateId);
  if (!state) throw new LocationError('Invalid state selected');

  const city = await cityModel.getActiveById(cityId);
  if (!city) throw new LocationError('Invalid city selected');

  if (Number(city.state_id) !== Number(stateId)) {
    throw new LocationError('Selected city does not belong to the selected state');
  }

  return {
    state_id: Number(stateId),
    city_id: Number(cityId),
    state: state.name,
    city: city.name,
  };
};

module.exports = { resolveStateCity, LocationError };
