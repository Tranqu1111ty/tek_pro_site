import { content } from "../../data/content";
import DynamicWaveCanvasBackground from "../ui/dynamic-wave-canvas-background";

export function Footer() {
  return (
    <footer className="site-footer" id="contacts">
      <DynamicWaveCanvasBackground />
      <div className="footer-grid">
        <div className="footer-heading">
          <img src="/media/logo6.png" alt="ТЭКПРО" />
        </div>
        <div className="footer-contact-line">
          <a className="contact-primary" href={`mailto:${content.contacts.email}`}>
            {content.contacts.email} <span>↗</span>
          </a>
          <h2>Обсудить проект</h2>
        </div>
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
            <span>Координаты</span>
            <p>{content.contacts.navigation}</p>
          </div>
        </div>
        <dl className="footer-legal-details" aria-label="Реквизиты компании">
          <div>
            <dt>ИНН</dt>
            <dd>{content.legal.inn}</dd>
          </div>
          <div>
            <dt>КПП</dt>
            <dd>{content.legal.kpp}</dd>
          </div>
          <div>
            <dt>ОГРН</dt>
            <dd>{content.legal.ogrn}</dd>
          </div>
          <div className="footer-okved">
            <dt>ОКВЭД</dt>
            <dd>{content.legal.okved}</dd>
          </div>
        </dl>
        <div className="footer-bottom">
          <p>© ТЭКПРО</p>
          <a href="/documents/ptekpropd.pdf" target="_blank" rel="noreferrer">
            Политика конфиденциальности
          </a>
          <a href="/cookie-policy">Политика cookie</a>
          <a href="#top">Наверх ↑</a>
        </div>
      </div>
    </footer>
  );
}
