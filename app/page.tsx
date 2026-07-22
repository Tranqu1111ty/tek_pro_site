import { CinematicHero } from "../components/cinematic/CinematicHero";
import { DetailRegister, NumberedList, PlainList } from "../components/company/Registers";
import { DroneStage } from "../components/it-ai/DroneStage";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { SectionShell } from "../components/layout/SectionShell";
import { content } from "../data/content";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <CinematicHero />

        <SectionShell
          id="about"
          index="01"
          label="Профиль компании"
          title="О компании"
          tone="navy"
          className="about-section"
        >
          <div className="about-lead">
            {content.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
          <div className="standards-register" aria-label="Стандарты интегрированной системы менеджмента">
            <p className="utility-label">Интегрированная система менеджмента</p>
            {content.standards.map((standard) => (
              <div key={standard}>{standard}</div>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="cycle"
          index="02"
          label="Проектно-изыскательские работы"
          title="Полный цикл"
          tone="white"
          className="cycle-section"
        >
          <p className="section-intro">{content.about[1]}</p>
          <NumberedList items={content.process} />
        </SectionShell>

        <SectionShell
          id="competencies"
          index="03"
          label="Основные направления деятельности"
          title="Компетенции"
          tone="navy"
          className="competencies-section"
        >
          <div className="direction-strip">
            {content.workDirections.map((direction, index) => (
              <div key={direction}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{direction}</p>
              </div>
            ))}
          </div>

          <div className="details-stack">
            <DetailRegister title="Сбор и транспорт нефти и газа" code="3.1" open>
              <PlainList items={content.oilAndGas} />
            </DetailRegister>
            <DetailRegister title="Подготовка нефти и газа и генеральный план месторождения" code="3.2">
              <PlainList items={content.fieldPlan} />
            </DetailRegister>
            <DetailRegister title="Проектирование" code="3.3">
              <p className="document-code">{content.projecting.registration}</p>
              <p>{content.projecting.summary}</p>
              <PlainList items={content.projecting.items} />
            </DetailRegister>
            <DetailRegister title="Инженерная защита" code="3.4">
              <PlainList items={content.protection} />
            </DetailRegister>
            <DetailRegister title="Экспертиза" code="3.5">
              <PlainList items={content.expertise} />
            </DetailRegister>
            <DetailRegister title={content.surveys.title} code="3.6">
              <p className="document-code">{content.surveys.registration}</p>
            </DetailRegister>
            <DetailRegister title="Авторский надзор за строительством" code="3.7">
              <p>Авторский надзор за строительством.</p>
            </DetailRegister>
          </div>
        </SectionShell>

        <SectionShell
          id="technologies"
          index="04"
          label="Собственные компьютерные технологии"
          title="Расчёты и моделирование"
          tone="black"
          className="technologies-section"
        >
          <p className="section-intro">{content.technologies.intro}</p>
          <NumberedList items={content.technologies.items} compact />
          <div className="support-note">
            <p className="utility-label">Сопровождение проектов</p>
            <p>{content.projectSupport}</p>
          </div>
        </SectionShell>

        <SectionShell
          id="laboratory"
          index="05"
          label="Испытательная лаборатория"
          title={content.lab.title}
          tone="white"
          className="laboratory-section"
        >
          <div className="lab-intro">
            <div>
              <p className="document-code">{content.lab.registration}</p>
              <p>{content.lab.description}</p>
              <p>{content.lab.certificate}</p>
            </div>
            <figure className="certificate-figure">
              <a href="/media/sertificate.jpg" target="_blank" rel="noreferrer">
                <img
                  src="/media/sertificate.jpg"
                  alt="Свидетельство об аккредитации испытательной лаборатории № ИЛ-РОС-000965 СДС РосОснова"
                />
              </a>
              <figcaption>Открыть свидетельство в полном размере ↗</figcaption>
            </figure>
          </div>
          <div className="details-stack laboratory-registers">
            <p className="laboratory-work-label">Лаборатория механики грунтов нашего института выполняет следующие виды работ:</p>
            <DetailRegister title="Определение характеристик прочности и деформируемости дисперсных грунтов" code="5.1" open>
              <PlainList items={content.lab.mechanics} />
            </DetailRegister>
            <DetailRegister title="Определение физических характеристик грунтов" code="5.2">
              <PlainList items={content.lab.physical} />
            </DetailRegister>
          </div>
        </SectionShell>

        <SectionShell
          id="experience"
          index="06"
          label="Документированная практика"
          title="Опыт"
          tone="navy"
          className="experience-section"
        >
          <div className="experience-register">
            {content.experience.map((entry, index) => (
              <article key={entry}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{entry}</p>
              </article>
            ))}
          </div>
        </SectionShell>

        <SectionShell
          id="it-ai"
          index="07"
          label="Специализированное подразделение"
          title="IT и искусственный интеллект"
          tone="black"
          className="it-section"
        >
          <div className="it-layout">
            <div className="it-copy">
              <p className="it-year">2025</p>
              <p>{content.itAi}</p>
              <div className="it-register" aria-label="Направления IT-подразделения">
                <span>Корпоративные цифровые платформы</span>
                <span>Аналитические системы</span>
                <span>Решения на базе технологий искусственного интеллекта</span>
              </div>
            </div>
            <DroneStage />
          </div>
        </SectionShell>
      </main>
      <Footer />
    </>
  );
}
