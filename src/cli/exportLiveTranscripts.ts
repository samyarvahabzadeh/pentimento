import { runAllLivePlaytests } from './runLiveTelegramPlaytest.js';

async function main() {
  const reports = await runAllLivePlaytests();

  console.log(`\n================================================================`);
  console.log(`📜 VERBATIM TELEGRAM BOT PLAYTHROUGH TRANSCRIPTS & AUDIT LOGS`);
  console.log(`================================================================\n`);

  for (const rep of reports) {
    console.log(`\n################################################################`);
    console.log(`### ${rep.title.toUpperCase()} (Role: ${rep.role})`);
    console.log(`################################################################\n`);

    for (const turn of rep.interactions) {
      console.log(`--- [Turn ${turn.turnIndex}] ---`);
      console.log(`PLAYER:`);
      console.log(turn.playerInput);
      console.log(`\nBOT:`);
      console.log(turn.botReply);
      if (turn.stateSnapshot) {
        console.log(`\n[State Snapshot]: Node=${turn.stateSnapshot.node}, Turn=${turn.stateSnapshot.turn}, Evidences=[${turn.stateSnapshot.evidence.join(', ')}], Clocks=${JSON.stringify(turn.stateSnapshot.clocks)}`);
      }
      console.log(``);
    }
  }
}

main();
