"use client";

import { content } from "@/data/content";
import {
  CardSticky,
  ContainerScroll,
  useSequenceEndAlignment,
} from "@/components/ui/CardSticky";
import { Accordion } from "@/components/ui/Accordion";

const cards = [
  {
    title: "Сбор и транспорт нефти и газа",
    lead: "Кусты скважин, КНС, линейные трубопроводы и расчёты трубопроводных систем.",
    items: content.oilAndGas,
    tone: "steel",
  },
  {
    title: "Подготовка нефти и газа",
    lead: "Резервуарные парки, базы хранения, промышленные и инфраструктурные объекты месторождений.",
    items: content.fieldPlan,
    tone: "mist",
  },
  {
    title: "Проектирование",
    lead: content.projecting.summary,
    items: content.projecting.items,
    note: content.projecting.registration,
    tone: "white",
  },
  {
    title: "Инженерная защита",
    lead: "Защита линейных, площадных и капитальных объектов от наводнений, подтопления и опасных геологических процессов.",
    items: content.protection,
    tone: "blue",
  },
  {
    title: "Экспертиза и изыскания",
    lead: "Техническая, промышленная и экологическая экспертиза. Инженерные изыскания и авторский надзор.",
    items: [...content.expertise, content.surveys.registration, "Авторский надзор за строительством"],
    tone: "navy",
  },
] as const;

export function StickyCompetencies() {
  const stackRef = useSequenceEndAlignment();

  return (
    <ContainerScroll ref={stackRef} className="competency-stack">
      {cards.map((card, index) => (
        <CardSticky
          key={card.title}
          index={index}
          incrementY={13}
          incrementZ={10}
          className={`competency-card competency-card-${card.tone}`}
        >
          <div className="competency-card-body">
            <div className="sequence-card-title">
              <h3>{card.title}</h3>
            </div>
            <p className="competency-lead">{card.lead}</p>
            {"note" in card ? <p className="competency-note">{card.note}</p> : null}
            <Accordion summary="Полный состав работ">
              <ul data-lenis-prevent data-lenis-prevent-wheel>
                {card.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Accordion>
          </div>
        </CardSticky>
      ))}
    </ContainerScroll>
  );
}
