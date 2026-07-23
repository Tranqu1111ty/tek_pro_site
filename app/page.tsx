import { CinematicHero } from "@/components/cinematic/CinematicHero";
import { StickyCompetencies } from "@/components/company/StickyCompetencies";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { ProcessCards } from "@/components/process/ProcessCards";
import { PageTimeline } from "@/components/ui/PageTimeline";
import { Accordion } from "@/components/ui/Accordion";
import { StickyScrollGallery, type DigitalCapability } from "@/components/ui/sticky-scroll";
import { content } from "@/data/content";

const digitalCapabilities = [
  {
    eyebrow: "ИИ / локальный контур",
    title: "Локальные ИИ-агенты",
    description: "Полноценные агенты в контуре заказчика — без внешних API моделей.",
    image: "/media/it-ai-agents.png",
    alt: "Абстрактная модель локальных ИИ-агентов в замкнутом вычислительном контуре",
    lane: "center",
  },
  {
    eyebrow: "Данные / аналитика",
    title: "BI-системы",
    description: "Проектирование и реализация систем бизнес-аналитики.",
    image: "/media/it-ai-bi.png",
    alt: "Абстрактная инженерная композиция системы бизнес-аналитики",
    lane: "left",
  },
  {
    eyebrow: "Контроль / месторождение",
    title: "Видеоаналитика",
    description: "Контроль процессов и действий на месторождении.",
    image: "/media/it-ai-video.png",
    alt: "Промышленная оптическая система наблюдения за моделью месторождения",
    lane: "left",
  },
  {
    eyebrow: "Архитектура / вычисления",
    title: "Инфраструктура ИИ-контура",
    description: "Проектирование и реализация инфраструктуры для ИИ-систем.",
    image: "/media/it-ai-infrastructure.png",
    alt: "Абстрактная модульная вычислительная инфраструктура для ИИ-систем",
    lane: "center",
  },
  {
    eyebrow: "Платформы данных",
    title: "Data Lake и DWH",
    description: "Полный цикл проектирования и реализации платформ данных.",
    image: "/media/it-ai-data.png",
    alt: "Абстрактная архитектура озера данных и хранилища данных",
    lane: "left",
  },
  {
    eyebrow: "Сигналы / анализ",
    title: "Аудиоаналитика",
    description: "Реализация систем анализа аудиоданных.",
    image: "/media/it-ai-audio.png",
    alt: "Абстрактная система анализа промышленного аудиосигнала",
    lane: "left",
  },
  {
    eyebrow: "Процессы / отчётность",
    title: "Документооборот",
    description: "Автоматизация документов и сдачи отчётности.",
    image: "/media/it-ai-documents.png",
    alt: "Абстрактная механическая система автоматизации документооборота",
    lane: "right",
  },
  {
    eyebrow: "Автоматизация / производство",
    title: "Роботизированные системы",
    description: "Разработка и изготовление под задачи заказчика.",
    image: "/media/it-ai-robotics.png",
    alt: "Промышленная роботизированная система с точным инструментом",
    lane: "right",
  },
  {
    eyebrow: "Управление / инфраструктура",
    title: "SCADA-системы",
    description: "Проектирование и реализация систем диспетчерского управления.",
    image: "/media/it-ai-scada.png",
    alt: "Абстрактная модель промышленного объекта и системы SCADA",
    lane: "right",
  },
  {
    eyebrow: "Разработка / процессы",
    title: "Веб-приложения",
    description: "Кастомные решения для процессов заказчика.",
    image: "/media/it-ai-webapps.png",
    alt: "Модульная архитектура веб-приложений для промышленных процессов",
    lane: "right",
  },
] as const satisfies readonly DigitalCapability[];

export default function Home() {
  return (
    <>
      <Header />
      <PageTimeline />
      <main>
        <CinematicHero />

        <section className="section positioning" id="about">
          <div className="company-overview">
            <p className="section-index">Компания</p>
            <h2>
              Проектируем инфраструктуру,
              <br />
              которая работает в реальных условиях.
            </h2>
            <p className="positioning-lead">
              ТЭКПРО выполняет комплексное проектирование объектов обустройства нефтегазовых
              месторождений, подготовки и транспорта нефти и газа, железных и автомобильных дорог,
              мостов и искусственных сооружений.
            </p>
          </div>

          <div className="company-detail-rail">
            <div className="company-card-grid" aria-label="Ключевые сведения о компании">
              <article className="company-info-card">
                <img src="/media/company-cycle.png" width="1536" height="1024" loading="lazy" alt="Абстрактное изображение полного инженерного цикла" />
                <div className="company-card-caption">
                  <span>Цикл</span>
                  <h3>Проектно-изыскательские работы и сопровождение объектов</h3>
                </div>
              </article>
              <article className="company-info-card">
                <img src="/media/company-stages.png" width="1536" height="1024" loading="lazy" alt="Абстрактное изображение стадий проектной документации" />
                <div className="company-card-caption">
                  <span>Стадии</span>
                  <h3>ОТР / Проект / Рабочая документация</h3>
                </div>
              </article>
              <article className="company-info-card">
                <img src="/media/company-geography.png" width="1536" height="1024" loading="lazy" alt="Абстрактное изображение протяжённой инженерной инфраструктуры" />
                <div className="company-card-caption">
                  <span>География</span>
                  <h3>От Дальнего Востока до западных границ России</h3>
                </div>
              </article>
            </div>
            <Accordion className="fact-disclosure" summary="Полная формулировка о компании">
              <div>
                {content.about.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
            </Accordion>
          </div>
        </section>

        <section className="section process-section" id="cycle">
          <div className="split-sequence split-sequence-process">
            <div className="sequence-cards sequence-cards-left">
              <ProcessCards />
            </div>
            <div className="sequence-copy sequence-copy-right">
              <p className="section-index">Стадии / 01–07</p>
              <h2>Семь связанных стадий.<br />Одна инженерная система.</h2>
              <p className="section-note">От исследования территории до контроля реализации объекта.</p>
            </div>
          </div>
        </section>

        <section className="section competencies-section" id="competencies">
          <div className="split-sequence split-sequence-competencies">
            <div className="sequence-copy sequence-copy-left">
              <p className="section-index">Компетенции</p>
              <h2>Работа с территорией,<br />инфраструктурой и рисками.</h2>
              <p className="section-note">
                Пять направлений: нефтегазовая инфраструктура, проектирование, инженерная защита,
                экспертиза и изыскания.
              </p>
            </div>
            <div className="sequence-cards sequence-cards-right">
              <StickyCompetencies />
            </div>
          </div>
        </section>

        <section className="section technical-section" id="standards">
          <div className="section-grid technical-heading">
            <p className="section-index">Нормативная база</p>
            <h2>Нормативная база<br />и проверяемые данные.</h2>
            <p className="section-note">Документы, регистрации и область лабораторных испытаний.</p>
          </div>

          <div className="technical-register">
            <div className="normative-cards">
              <article className="normative-card normative-standards-card">
                <div className="normative-card-copy">
                  <span className="normative-card-kicker">ИСМ</span>
                  <h3>Стандарты</h3>
                  <ul>{content.standards.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <img src="/media/normative-standards.png" width="1536" height="1024" loading="lazy" alt="Абстрактная композиция проверяемых инженерных стандартов" />
              </article>

              <article className="normative-card normative-feature-card">
                <div className="normative-card-copy">
                  <span className="normative-card-kicker">СРО</span>
                  <h3>Проектирование и изыскания</h3>
                  <ul className="normative-card-data">
                    <li>{content.projecting.registration}</li>
                    <li>{content.surveys.registration}</li>
                  </ul>
                  <p className="normative-card-summary">{content.projecting.summary}</p>
                </div>
                <img src="/media/normative-design-surveys.png" width="1536" height="1024" loading="lazy" alt="Абстрактная инженерная модель проектирования и изысканий" />
              </article>
            </div>

            <article className="register-block laboratory-block" id="laboratory">
              <header><span>ИЛ</span><h3>Лаборатория механики грунтов</h3></header>
              <div className="laboratory-layout">
                <a className="certificate" href="/media/sertificate.jpg" target="_blank" rel="noreferrer">
                  <img src="/media/sertificate.jpg" alt="Свидетельство об аккредитации испытательной лаборатории № ИЛ-РОС-000965" />
                  <span>Открыть свидетельство ↗</span>
                </a>
                <div className="laboratory-copy">
                  <p className="document-code">{content.lab.registration}</p>
                  <p>{content.lab.description}</p>
                  <Accordion summary="Прочность и деформируемость">
                    <ul>{content.lab.mechanics.map((item) => <li key={item}>{item}</li>)}</ul>
                  </Accordion>
                  <Accordion summary="Физические характеристики">
                    <ul>{content.lab.physical.map((item) => <li key={item}>{item}</li>)}</ul>
                  </Accordion>
                </div>
              </div>
            </article>

            <article className="register-block computation-block">
              <header><span>Модели</span><h3>Расчёты и моделирование</h3></header>
              <p>{content.technologies.intro}</p>
              <Accordion summary="Перечень технологий">
                <ol>{content.technologies.items.map((item) => <li key={item}>{item}</li>)}</ol>
              </Accordion>
              <p className="document-code">{content.projectSupport}</p>
            </article>
          </div>
        </section>

        <section className="section digital-section" id="it-ai">
          <StickyScrollGallery intro={content.itAi} items={digitalCapabilities} />
        </section>

        <section className="section experience-section" id="experience">
          <div className="section-grid experience-heading">
            <p className="section-index">Опыт</p>
            <h2>Документированная<br />практика.</h2>
          </div>
          <div className="experience-list">
            {content.experience.map((entry, index) => (
              <article key={entry}><span>{String(index + 1).padStart(2, "0")}</span><p>{entry}</p></article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
