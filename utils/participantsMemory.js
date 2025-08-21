// utils/participantsMemory.js
const memory = {};

function getUsed(groupId) {
    return memory[groupId] || [];
}

function markAsUsed(groupId, participantId) {
    if (!memory[groupId]) {
        memory[groupId] = [];
    }
    
    if (!memory[groupId].includes(participantId)) {
        memory[groupId].push(participantId);
    }
    
    // Limitar memória aos 50 últimos usados
    if (memory[groupId].length > 15) {
        memory[groupId] = memory[groupId].slice(-50);
    }
}

function resetMemory(groupId) {
    memory[groupId] = [];
}

module.exports = {
    getUsed,
    markAsUsed,
    resetMemory
};