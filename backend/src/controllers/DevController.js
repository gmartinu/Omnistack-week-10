const Dev = require('../models/Dev');
const parseStringAsArray = require('../utils/parseStringAsArray');
const githubUser = require('../utils/githubUser');
const {findConnections, sendMessage} = require('../websocket');

module.exports = {
  async index(req, res) {
    const devs = await Dev.find();

    return res.json(devs);
  },

  async show(req, res) {
    const {id} = req.params;
    const dev = await Dev.findById(id);

    return res.json(dev);
  },

  async store(req, res) {
    const {github_username, techs, latitude, longitude} = req.body;
    
    let dev = await Dev.findOne({github_username});

    if(!dev) {
      const {name, avatar_url, bio} = await githubUser(github_username);
      const techsArray = parseStringAsArray(techs);

      const location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      }
    
      dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location,
      });

      const sendSocketMessageTo = findConnections(
        {latitude, longitude},
        techsArray,
      );

      sendMessage(sendSocketMessageTo, 'new-dev', dev);
    }
  
    return res.json(dev);
  },

  async update(req, res) {
    const {id} = req.params;
    const {github_username, techs, latitude, longitude} = req.body;
    const dev = await Dev.findById(id);

    if(dev) {
      const {name, avatar_url, bio} = await githubUser(github_username); 
      const techsArray = parseStringAsArray(techs);

      const location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };

      dev.name = name;
      dev.avatar_url = avatar_url;
      dev.bio = bio;
      dev.techs = techsArray;
      dev.location = location;
      dev.save()
      
      return res.json(dev);
      
    } else {
      return res.status(404).json({ error: 'Dev not found' });
    }
    
  },

  async destroy(req, res) {
    const {id} = req.params;
    const dev = await Dev.findByIdAndDelete(id);
    if(!dev) {
      return res.status(404).json({ error: 'Dev not found' })
    }
    return res.json(dev);
  },
};
