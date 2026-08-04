import { generateChangelog } from '../plugins/vite-plugin-changelog';

// generates public/changelog.json on the CI runner, where .git is still available
const count = generateChangelog();

if (count === null) {
  console.log('kept existing changelog.json');
} else if (count === 0) {
  console.error('changelog is empty — no feat: commits found or git unavailable');
  process.exit(1);
} else {
  console.log(`changelog.json generated (${count} entries)`);
}
