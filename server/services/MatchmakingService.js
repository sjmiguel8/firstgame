class MatchmakingService {
  constructor() {
    this.queue = new Set();
  }

  addToQueue(playerId) {
    this.queue.add(playerId);
    return this.findMatch(playerId);
  }

  removeFromQueue(playerId) {
    this.queue.delete(playerId);
  }

  findMatch(playerId) {
    for (const potentialOpponent of this.queue) {
      if (potentialOpponent !== playerId) {
        this.queue.delete(potentialOpponent);
        this.queue.delete(playerId);
        return potentialOpponent;
      }
    }
    return null;
  }

  getQueueLength() {
    return this.queue.size;
  }
}

module.exports = new MatchmakingService(); 