// Social feed messages. Legal constraints (loi Évin + store policies):
// keep them descriptive/playful about the EVENT of logging a drink, never
// inciting anyone to drink (more), and free of any alcohol brand references.
const messages = [
    "A shot has been logged by a Crew member. 🥃",
    "New entry in the Crew logbook! 📒",
    "Someone in your Crew just raised a glass. 🍻",
    "Cheers detected in the perimeter! 🔔",
    "A toast has been made. Santé! 🥂",
    "The Crew logbook has a new line. ✍️",
    "One of your buddies just checked in a drink. 📍",
    "Glasses clinked somewhere in your Crew. 🍻",
    "A round has been recorded. 🧾",
    "Your Crew's evening is officially on the record. 🌙",
];

export const getRandomShotMessage = () => {
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
};
