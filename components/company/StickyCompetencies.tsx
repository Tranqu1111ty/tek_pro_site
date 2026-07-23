"use client";

import * as React from "react";

import { content } from "@/data/content";
import { CardSticky, ContainerScroll } from "@/components/ui/CardSticky";
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
  const stackRef = React.useRef<HTMLDivElement>(null);

  // Sticky-карточка вылетает из стека раньше остальных, если её нижний край
  // ниже: контейнер «доталкивает» её первой. Держим все карточки одной высоты
  // (по самой высокой), чтобы стек складывался синхронно.
  React.useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;
    const bodies = Array.from(stack.querySelectorAll<HTMLElement>(".competency-card-body"));
    if (bodies.length === 0) return;
    const sync = () => {
      stack.style.setProperty("--deck-h", "auto");
      // Панель открытого аккордеона исключаем из замера: высота колоды
      // считается по закрытому состоянию, чтобы при раскрытии росла только
      // сама открытая карточка, а не все сразу.
      const max = Math.max(
        ...bodies.map((body) => {
          const panel = body.querySelector<HTMLElement>(".accordion-panel");
          return body.offsetHeight - (panel?.offsetHeight ?? 0);
        }),
      );
      stack.style.setProperty("--deck-h", `${max}px`);
    };
    sync();
    // Пересчёт откладываем на следующий кадр: мутация размеров прямо в
    // колбэке ResizeObserver вызывает "loop completed with undelivered
    // notifications".
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(sync);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(stack);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <ContainerScroll ref={stackRef} className="competency-stack">
      {cards.map((card, index) => (
        <CardSticky
          key={card.title}
          index={index + 8}
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
              <ul>
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
