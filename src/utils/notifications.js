const messages = [
    "Un Jäger n'rive jamais seul. 🔥🦌",
    "Alerte : Un Jäger-bomb a été largué par un membre du Crew ! 💣",
    "Appuyez sur F pour rendre hommage à ce foie. 🫡🥃",
    "Le cerf est de sortie ! Chassez-le si vous pouvez. 🦌",
    "100% de batterie, 0% de sobriété détectés chez votre ami. ⚡️",
    "Un Jäger, deux Jäger, trois Jäger... dodo approche ? 🛌",
    "Status : En cours de transformation en sapin de Noël Jäger. 🌲",
    "Ceci n'est pas un exercice. Un shot a été détecté dans le périmètre ! 🚨",
    "L'eau c'est pour les pâtes. Le Jäger c'est pour les légendes du Crew. 🍝👑",
    "Un shot de survie vient d'être consommé. Protocole activé. 🧪🥃",
    "Le GPS indique : Direction l'ivresse. Suivez le guide ! 📍",
    "Sensation de chaleur détectée à base de 56 plantes médicinales. 🪴",
    "Un Jäger sauvage apparaît dans votre fil d'actu ! 👾",
    "Plus efficace qu'une tisane de grand-mère. Garanti sans sommeil. ☕️❌",
    "Alerte météo : Pluie de shots prévue sur votre groupe d'amis. 🌧️🥃",
    "Votre ami tente une approche diplomatique musclée avec le barman. 🍸",
    "Le secret de la jeunesse éternelle a encore frappé ! ✨",
    "Un shot, et ça repart ! (ou alors ça s'arrête net). 🚀",
    "L'abus d'alcool est dangereux, mais la Jäger est délicieuse. ⚖️🥃",
    "Fin de la séance de sport cérébral, début de la récup' Jäger ! 🏋️‍♂️🍹"
];

export const getRandomJagerMessage = () => {
    const index = Math.floor(Math.random() * messages.length);
    return messages[index];
};
