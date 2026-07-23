"use client";

import {
  CardSticky,
  ContainerScroll,
  useSequenceEndAlignment,
} from "@/components/ui/CardSticky";

const stages = [
  ["Инженерные изыскания", "Работы в рамках свидетельства СРО № СРО-И-037-18122012."],
  ["Основные технические решения", "Самостоятельная стадия полного цикла проектно-сметной документации."],
  ["Проект", "Генеральный план и транспорт, технологические, архитектурно-строительные и специальные разделы."],
  ["Рабочая документация", "Документация, которой команда обеспечивает строительство объектов."],
  ["Научное сопровождение", "Сопровождение проекта на стадиях его жизненного цикла."],
  ["Авторский надзор", "Сопровождение объекта непосредственно в период строительства."],
  ["Строительный контроль", "Контроль на стадии реализации объекта."],
] as const;

export function ProcessCards() {
  const stackRef = useSequenceEndAlignment();

  return (
    <ContainerScroll ref={stackRef} className="process-card-stack">
      {stages.map(([title, description], index) => (
        <CardSticky
          key={title}
          index={index}
          incrementY={13}
          incrementZ={10}
          className="process-card"
        >
          <div className="sequence-card-title">
            <h3>{title}</h3>
          </div>
          <p>{description}</p>
        </CardSticky>
      ))}
    </ContainerScroll>
  );
}
