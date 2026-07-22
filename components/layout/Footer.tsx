import { content } from "../../data/content";

export function Footer() {
  return (
    <footer className="site-footer" id="contacts">
      <div className="footer-grid blueprint-grid">
        <p className="utility-label">Связаться с ТЭКПРО</p>
        <h2>Обсудить проект</h2>
        <a className="contact-primary" href={`mailto:${content.contacts.email}`}>
          {content.contacts.email}
        </a>
        <div className="contact-register">
          <div>
            <span>Адрес</span>
            <p>{content.contacts.address}</p>
          </div>
          <div>
            <span>Телефон</span>
            <a href="tel:+74953320053">Тел. : {content.contacts.phone}</a>
          </div>
          <div>
            <span>Факс</span>
            <p>Факс : {content.contacts.fax}</p>
          </div>
          <div>
            <span>Схема проезда / координаты</span>
            <p>{content.contacts.navigation}</p>
          </div>
        </div>
        <p className="contact-source-line">{content.contacts.fullLine}</p>
        <div className="footer-bottom">
          <p>© ТЭКПРО</p>
          <a href={`mailto:${content.contacts.email}`}>E-mail : {content.contacts.email}</a>
          <a href="/documents/ptekpropd.pdf" target="_blank" rel="noreferrer">
            Политика конфиденциальности
          </a>
          <a href="#top">Наверх ↑</a>
        </div>
      </div>
    </footer>
  );
}
