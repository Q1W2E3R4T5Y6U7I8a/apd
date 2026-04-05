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
      message: `> Hi, I am Maks! 24 y.o ukrainian that lives in Switzerland and studies Data Science at UniNE.
> 
> I have factual believe: IF THERE IS NO STRUCTURE -> IT'S ALMOST IMPOSSIBLE TO "BUILD" THE NEEDED FUNDAMENTALS IN LIFE -> ALMOST ALWAYS THE LIFE/PROJECT COLLAPSES (THOUGH MAYBE THERE EVEN ARE LUCKY ONES)
> 
> From 15y.o I was kind of obsessed with analytics and since then I write my dreams/goals/habits/money every very specifically, though it's not just a "todo list"
> 
> [1] When I am feeling "lost" I need to look at my personal "constitution", on what rules I have to look, remind what I stand/live for.
> IF U WON'T DO THAT, SMB WILL DECIDE FOR U.
> 
> [2] Sometimes I need to inspire because well life sometimes doesn't make sense, though I need to remind that it's me specifically to who that question of "what's the point" is asked.
> To look at the map, dots with adventures/dreams that I want to do
> 
> [3,4,5,6] Calendar/daily todo/statistics/finance it's the core on how I achieve the first two. It's the most boring thing but ironically it's most where I spent time for.
> Sometimes forgetting what it's for but still, it's kind of like with breathing.
> 
> It's not like I live to breathe, it's not my point of life, though I do it literally all the time.
> Especially it becomes important for when I am not breathing with all my lungs
> 
> Please, please give a feedback if u will so, u can find me at: telegram, instagram, email, whatsapp
> `,
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
      message: `> Привіт, я Макс! 24-річний українець, який живе у Швейцарії та вивчає Data Science в UniNE.
> 
> Моє переконання: ЯКЩО НЕМАЄ СТРУКТУРИ -> МАЙЖЕ НЕМОЖЛИВО "ПОБУДУВАТИ" ПОТРІБНІ ФУНДАМЕНТИ В ЖИТТІ -> МАЙЖЕ ЗАВЖДИ ЖИТТЯ/ПРОЄКТ РУЙНУЄТЬСЯ (ХОЧА МОЖЛИВО Є ЩАСЛИВЧИКИ)
> 
> З 15 років я був трохи одержимий аналітикою і з того часу я дуже детально записую свої мрії/цілі/звички/гроші, хоча це не просто "список справ"
> 
> [1] Коли я відчуваю себе "втраченим", мені потрібно подивитися на свою особисту "конституцію", на правила, які я маю переглянути, нагадати, за чим я стою/для чого живу.
> ЯКЩО ТИ ЦЬОГО НЕ ЗРОБИШ, ХТОСЬ ІНШИЙ ВИРІШИТЬ ЗА ТЕБЕ.
> 
> [2] Іноді мені потрібне натхнення, тому що життя іноді не має сенсу, але я повинен нагадати собі, що саме мені поставлене питання "в чому сенс".
> Подивитися на карту, точки з пригодами/мріями, які я хочу здійснити
> 
> [3,4,5,6] Календар/щоденні завдання/статистика/фінанси - це основа, як я досягаю перших двох. Це найнудніша річ, але за іронією долі саме на це я витрачаю найбільше часу.
> Іноді забуваючи для чого це, але все одно, це як з диханням.
> 
> Я не живу, щоб дихати, це не сенс мого життя, хоча я роблю це постійно.
> Особливо це стає важливим, коли я не дихаю на повні груди
> 
> Будь ласка, дайте зворотний зв'язок, якщо захочете, ви можете знайти мене в: telegram, instagram, email, whatsapp
>`,
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
      message: `> Salut, je suis Maks! 24 ans, ukrainien vivant en Suisse, étudiant en Data Science à UniNE.
> 
> Ma conviction: S'IL N'Y A PAS DE STRUCTURE -> IL EST PRESQUE IMPOSSIBLE DE "CONSTRUIRE" LES FONDAMENTAUX NÉCESSAIRES DANS LA VIE -> PRESQUE TOUJOURS LA VIE/LE PROJET S'EFFONDRE (MÊME S'IL Y A DES CHANCEUX)
> 
> Dès 15 ans, j'étais un peu obsédé par l'analytique et depuis, j'écris très spécifiquement mes rêves/objectifs/habitudes/argent, même si ce n'est pas juste une "liste de tâches"
> 
> [1] Quand je me sens "perdu", j'ai besoin de regarder ma "constitution" personnelle, quelles règles je dois consulter, me rappeler ce qui est important pour moi.
> SI TU NE LE FAIS PAS, QUELQU'UN D'AUTRE DÉCIDERA POUR TOI.
> 
> [2] Parfois j'ai besoin d'inspiration car la vie n'a parfois pas de sens, mais je dois me rappeler que c'est à moi spécifiquement que la question "quel est le but" est posée.
> Regarder la carte, les points avec les aventures/rêves que je veux réaliser
> 
> [3,4,5,6] Calendrier/tâches quotidiennes/statistiques/finances sont le cœur de la façon dont j'atteins les deux premiers. C'est la chose la plus ennuyeuse mais ironiquement c'est là où je passe le plus de temps.
> Oubliant parfois pourquoi, mais c'est un peu comme respirer.
> 
> Je ne vis pas pour respirer, ce n'est pas mon but dans la vie, même si je le fais tout le temps.
> Cela devient particulièrement important quand je ne respire pas à pleins poumons
> 
> S'il vous plaît, donnez-moi un retour si vous le souhaitez, vous pouvez me trouver sur: telegram, instagram, email, whatsapp
> 
>`,
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
            src="/en.png" 
            alt="English" 
            className={`flag ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          />
          <img 
            src="/ua.png" 
            alt="Ukrainian" 
            className={`flag ${language === 'uk' ? 'active' : ''}`}
            onClick={() => setLanguage('uk')}
          />
          <img 
            src="/fr.png" 
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