/**
 * Central branding & legal-compliance strings.
 *
 * IMPORTANT (trademark): the app must NOT use the name "Jäger"/"Jägermeister",
 * the stag logo, or other elements of the Mast-Jägermeister SE brand — they are
 * registered trademarks and both Apple (guideline 5.2.1) and Google Play reject
 * apps that use third-party brands without authorization. "APP_NAME" below is a
 * neutral placeholder: change it once here to rebrand the whole UI.
 *
 * IMPORTANT (loi Évin, France): any surface that talks about alcohol must stay
 * informative/tracking-oriented, never incite consumption, and display the
 * statutory health warning below.
 */

export const APP_NAME = "Shot Tracker";

// Statutory French health warning (loi Évin / Code de la santé publique)
export const HEALTH_WARNING_FR = "L'abus d'alcool est dangereux pour la santé. À consommer avec modération.";
export const HEALTH_WARNING_EN = "Alcohol abuse is dangerous for your health. Drink responsibly.";

// French national alcohol help line & site (free, anonymous)
export const HELP_LINE_NAME = "Alcool Info Service";
export const HELP_LINE_PHONE = "0 980 980 930";
export const HELP_LINE_URL = "https://www.alcool-info-service.fr";

// Minimum legal drinking age gate (France: 18)
export const MIN_AGE = 18;
export const AGE_GATE_STORAGE_KEY = "ageConfirmed_v1";
