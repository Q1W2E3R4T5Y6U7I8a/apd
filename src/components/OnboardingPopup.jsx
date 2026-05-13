import React, { useState } from 'react';
import './OnboardingPopup.scss';

const OnboardingPopup = ({ onClose }) => {
  const [language, setLanguage] = useState('en');

  const handleClose = () => {
    localStorage.setItem('apd_onboarding_seen', 'true');
    if (onClose) onClose();
  };

  // ========== CONTENT ==========
  const content = {
    en: {
      message: `> Hi, I'm Maks — 24, Ukrainian, living in Switzerland, studying Data Science at UniNE.
>
> I built this app for myself because Google Sheets and calendars weren't enough for personal planning. I wanted one place for everything. Nothing redundant.
>
> This app was partly inspired by "Avatar: The Last Airbender", as in the cartoon, I kind of split life into 4 "elements":
> 🔥 Fire = love & passion
> 💨 Air = spirituality & clarity
> 🌍 Earth = groundedness & discipline
> 💧 Water = flow state & adaptability
>
> Apart from regular todo list apps I added 3 functionalities:
> [1] Personal "constitution" — to read if feel the right direction, remind what you stand for
> [2] Dream map — adventures to visually see, what is ahead that motivates me
> [3] Export data to file — so AI can analyze it
>
> Please don't hesitate to contact for feedback or just to chat ^^`,
      devStatus: "📦 The app is in development. For the moment it's only in English. Here is a group where we discuss features. As a developer, I'm not sure if someone likes this app — if you do, please tell me and I will start working on updates!",
      links: [
        { name: "TELEGRAM", url: "https://t.me/makarakma", icon: "💬" },
        { name: "INSTAGRAM", url: "https://instagram.com/makarkarma", icon: "📸" },
        { name: "EMAIL", url: "mailto:maksym.karashevskyi@gmail.com", icon: "✉️" },
        { name: "WHATSAPP", url: "https://wa.me/41783388135", icon: "📞" }
      ],
      dataScienceLink: "https://q1w2e3r4t5y6u7i8a.github.io/dumy_page/",
      closeButton: "> UNDERSTAND_AND_EXPLORE"
    },
    uk: {
      message: `> Привіт, я Макс — 24, українець, живу у Швейцарії, вивчаю Data Science в UniNE.
>
> Я створив цей додаток для себе, тому що Google Sheets та календарів було недостатньо для особистого планування. Я хотів одне місце для всього. Нічого зайвого.
>
> Цей додаток частково натхненний "Аватаром: Останній захисник", як у мультфільмі, я розділяю життя на 4 "стихії":
> 🔥 Вогонь = любов і пристрасть
> 💨 Повітря = духовність і ясність
> 🌍 Земля = заземленість і дисципліна
> 💧 Вода = плинність і адаптивність
>
> Окрім звичайних todo-додатків, я додав 3 функції:
> [1] Особиста "конституція" — читати, коли відчуваєш втрату напрямку, нагадує, за що ти стоїш
> [2] Карта мрій — пригоди, щоб візуально бачити, що попереду і мотивує мене
> [3] Експорт даних у файл — щоб AI міг аналізувати
>
> Не соромтеся звертатися для зворотного зв'язку або просто поспілкуватися ^^`,
      devStatus: "📦 Додаток на стадії розробки. Наразі він доступний лише англійською мовою. Ось група, де ми обговорюємо функції. Як розробник, я не впевнений, чи комусь подобається цей додаток — якщо так, будь ласка, скажи мені, і я почну працювати над оновленнями!",
      links: [
        { name: "TELEGRAM", url: "https://t.me/makarakma", icon: "💬" },
        { name: "INSTAGRAM", url: "https://instagram.com/makarkarma", icon: "📸" },
        { name: "EMAIL", url: "mailto:maksym.karashevskyi@gmail.com", icon: "✉️" },
        { name: "WHATSAPP", url: "https://wa.me/41783388135", icon: "📞" }
      ],
      dataScienceLink: "https://q1w2e3r4t5y6u7i8a.github.io/dumy_page/",
      closeButton: "> ЗРОЗУМІВ"
    },
    fr: {
      message: `> Salut, je suis Maks — 24 ans, ukrainien, vivant en Suisse, étudiant en Data Science à UniNE.
>
> J'ai construit cette app pour moi parce que Google Sheets et les calendriers ne suffisaient pas pour la planification personnelle. Je voulais un seul endroit pour tout. Rien de redondant.
>
> Cette app est en partie inspirée par "Avatar: Le Dernier Maître de l'Air", comme dans le dessin animé, je divise la vie en 4 "éléments":
> 🔥 Feu = amour & passion
> 💨 Air = spiritualité & clarté
> 🌍 Terre = ancrage & discipline
> 💧 Eau = flux & adaptabilité
>
> En plus des applis de todo list classiques, j'ai ajouté 3 fonctionnalités:
> [1] "Constitution" personnelle — à lire quand je perds ma direction, rappelle ce qui est important
> [2] Carte des rêves — aventures à voir visuellement, ce qui m'attend et me motive
> [3] Export des données — pour que l'IA puisse analyser
>
> N'hésitez pas à me contacter pour un retour ou juste discuter ^^`,
      devStatus: "📦 L'app est en développement. Pour le moment, elle n'est disponible qu'en anglais. Voici un groupe où nous discutons des fonctionnalités. En tant que développeur, je ne suis pas sûr si quelqu'un aime cette app — si c'est le cas, dites-moi et je commencerai à travailler sur les mises à jour!",
      links: [
        { name: "TELEGRAM", url: "https://t.me/makarakma", icon: "💬" },
        { name: "INSTAGRAM", url: "https://instagram.com/makarkarma", icon: "📸" },
        { name: "EMAIL", url: "mailto:maksym.karashevskyi@gmail.com", icon: "✉️" },
        { name: "WHATSAPP", url: "https://wa.me/41783388135", icon: "📞" }
      ],
      dataScienceLink: "https://q1w2e3r4t5y6u7i8a.github.io/data_science/",
      closeButton: "> COMPRIS_ET_EXPLORER"
    }
  };

  const current = content[language];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-popup">
        {/* Flags - Centered, no text */}
        <div className="flags-container">
          <img 
            src={`${process.env.PUBLIC_URL}/en.png`} 
            alt="English" 
            className={`flag ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
            />
            <img 
            src={`${process.env.PUBLIC_URL}/ua.png`} 
            alt="Ukrainian" 
            className={`flag ${language === 'uk' ? 'active' : ''}`}
            onClick={() => setLanguage('uk')}
            />
            <img 
            src={`${process.env.PUBLIC_URL}/fr.png`} 
            alt="French" 
            className={`flag ${language === 'fr' ? 'active' : ''}`}
            onClick={() => setLanguage('fr')}
            />
        </div>

        {/* Close button */}
        <button className="close-popup" onClick={handleClose}>[X]</button>

        {/* Terminal-style content */}
        <div className="popup-content">
          <div className="terminal-window-mini">
            <div className="terminal-header-mini">
              <span className="terminal-blink">●</span>
            </div>
            <div className="terminal-body-mini">
              <pre className="terminal-message">{current.message}</pre>
              
              <div className="contact-section">
                <div className="contact-links">
                  {current.links.map((link, i) => (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="contact-link">
                      [{link.icon}] {link.name}
                    </a>
                  ))}
                </div>
              </div>

              <div className="datascience-section">
                <a href={current.dataScienceLink} target="_blank" rel="noopener noreferrer" className="ds-link">
                  🌍 DUMY
                </a>
              </div>

              <div className="dev-status-section">
                <p className="dev-status-text">{current.devStatus}</p>
              </div>

              <button className="close-button" onClick={handleClose}>
                {current.closeButton} →
              </button>
            </div>
  
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingPopup;