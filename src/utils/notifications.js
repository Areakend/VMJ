const messages = [
    "A Jäger never flies solo. 🔥🦌",
    "Alert: A Jäger-bomb has been dropped by a Crew member! 💣",
    "Press F to pay respects to this liver. 🫡🥃",
    "The stag is out! Hunt it down if you can. 🦌",
    "100% battery, 0% sobriety detected in your friend. ⚡️",
    "One Jäger, two Jäger, three Jäger... nap time? 🛌",
    "Status: Currently transforming into a Jäger Christmas tree. 🌲",
    "This is not a drill. A shot has been detected in the perimeter! 🚨",
    "Water is for pasta. Jäger is for the Crew legends. 🍝👑",
    "A survival shot has just been consumed. Protocol activated. 🧪🥃",
    "GPS says: Direction: Inebriated. Follow the guide! 📍",
    "Heat wave detected: 56 medicinal plants incoming. 🪴",
    "A wild Jäger appears in your feed! 👾",
    "Better than grandma's tea. Guaranteed no sleep. ☕️❌",
    "Weather alert: Shot rain expected over your friend group. 🌧️🥃",
    "Your friend is attempting a bold diplomatic approach with the bartender. 🍸",
    "The secret of eternal youth has struck again! ✨",
    "One shot, and you're back in the game! (Or out of it). 🚀",
    "Drinking is dangerous, but Jäger is delicious. ⚖️🥃",
    "Brain workout over, Jäger recovery initiated! 🏋️‍♂️🍹"
];

export const getRandomJagerMessage = () => {
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
};
