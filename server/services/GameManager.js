class GameManager {
  constructor() {
    this.games = new Map();
  }

  createGame(player1Id) {
    const gameId = Math.random().toString(36).substring(7);
    this.games.set(gameId, {
      id: gameId,
      player1: {
        id: player1Id,
        lifePoints: 8000,
        field: [],
        hand: [],
        deck: []
      },
      player2: null,
      currentPhase: 'standbyPhase',
      currentTurn: 1,
      activePlayer: player1Id
    });
    return gameId;
  }

  joinGame(gameId, player2Id) {
    const game = this.games.get(gameId);
    if (!game || game.player2) return false;

    game.player2 = {
      id: player2Id,
      lifePoints: 8000,
      field: [],
      hand: [],
      deck: []
    };
    return true;
  }

  getGameState(gameId, playerId) {
    const game = this.games.get(gameId);
    if (!game) return null;

    // Return appropriate game state based on player perspective
    return {
      gameId: game.id,
      currentPhase: game.currentPhase,
      currentTurn: game.currentTurn,
      activePlayer: game.activePlayer,
      player: playerId === game.player1.id ? game.player1 : game.player2,
      opponent: playerId === game.player1.id ? game.player2 : game.player1
    };
  }

  updateGameState(gameId, update) {
    const game = this.games.get(gameId);
    if (!game) return false;

    Object.assign(game, update);
    return true;
  }
}

module.exports = new GameManager(); 