import React, { useState, useCallback } from 'react';
import { Container, Navbar, Button, Row, Col } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import de from 'date-fns/locale/de';
import BrauvorgangModal from './components/BrauvorgangModal';
import TerminModal from './components/TerminModal';
import RessourcenUebersicht from './components/RessourcenUebersicht';
import { initialResources, brauzeiten } from './data/resources';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'de': de,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

function App() {
  const [brauvorgaenge, setBrauvorgaenge] = useState([]);
  const [termine, setTermine] = useState([]);
  const [showBrauvorgangModal, setShowBrauvorgangModal] = useState(false);
  const [showTerminModal, setShowTerminModal] = useState(false);
  const [resources] = useState(initialResources);

  const kalenderEvents = [
    ...termine.map(termin => ({
      id: termin.id,
      title: termin.titel,
      start: termin.startDatum,
      end: termin.endDatum,
      resource: termin,
      className: 'termin-event'
    })),
    ...brauvorgaenge.map(brauvorgang => {
      const dauer = brauzeiten[brauvorgang.brauart].tage;
      const ende = new Date(brauvorgang.startDatum);
      ende.setDate(ende.getDate() + dauer);
      
      return {
        id: brauvorgang.id,
        title: `${brauvorgang.titel} - ${brauvorgang.gaertankName}`,
        start: brauvorgang.startDatum,
        end: ende,
        resource: brauvorgang,
        className: 'brauvorgang-event'
      };
    })
  ];

  const handleBrauvorgangSave = useCallback((brauvorgang) => {
    setBrauvorgaenge(prev => [...prev, brauvorgang]);
  }, []);

  const handleTerminSave = useCallback((termin) => {
    setTermine(prev => [...prev, termin]);
  }, []);

  const handleEventClick = useCallback((event) => {
    if (event.resource.typ === 'brauvorgang') {
      const brauvorgang = event.resource;
      const dauer = brauzeiten[brauvorgang.brauart].tage;
      alert(`Brauvorgang Details:\n\nTitel: ${brauvorgang.titel}\nBrauart: ${brauzeiten[brauvorgang.brauart].name}\nDauer: ${dauer} Tage\nGärtank: ${brauvorgang.gaertankName}\nFässer: ${brauvorgang.faesserNamen.join(', ')}`);
    } else {
      const termin = event.resource;
      alert(`Termin Details:\n\nTitel: ${termin.titel}\nStart: ${termin.startDatum.toLocaleString()}\nEnde: ${termin.endDatum.toLocaleString()}\nBeschreibung: ${termin.beschreibung || 'Keine'}`);
    }
  }, []);

  return (
    <div>
      <Navbar bg="primary" variant="dark" className="mb-4">
        <Container>
          <Navbar.Brand>Braukalender</Navbar.Brand>
          <div>
            <Button 
              variant="light" 
              className="me-2" 
              onClick={() => setShowTerminModal(true)}
            >
              + Termin
            </Button>
            <Button 
              variant="success" 
              onClick={() => setShowBrauvorgangModal(true)}
            >
              + Brauvorgang
            </Button>
          </div>
        </Container>
      </Navbar>

      <Container>
        <Row>
          <Col lg={8}>
            <div className="calendar-container">
              <Calendar
                localizer={localizer}
                events={kalenderEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                views={['month', 'week', 'day', 'agenda']}
                defaultView="month"
                messages={{
                  next: "Weiter",
                  previous: "Zurück",
                  today: "Heute",
                  month: "Monat",
                  week: "Woche",
                  day: "Tag",
                  agenda: "Agenda",
                  date: "Datum",
                  time: "Zeit",
                  event: "Termin",
                  noEventsInRange: "Keine Termine in diesem Zeitraum"
                }}
                onSelectEvent={handleEventClick}
                eventPropGetter={(event) => ({
                  className: event.className
                })}
              />
            </div>
          </Col>
          <Col lg={4}>
            <RessourcenUebersicht 
              resources={resources} 
              brauvorgaenge={brauvorgaenge} 
            />
          </Col>
        </Row>
      </Container>

      <BrauvorgangModal
        show={showBrauvorgangModal}
        handleClose={() => setShowBrauvorgangModal(false)}
        resources={resources}
        brauvorgaenge={brauvorgaenge}
        onSave={handleBrauvorgangSave}
      />

      <TerminModal
        show={showTerminModal}
        handleClose={() => setShowTerminModal(false)}
        onSave={handleTerminSave}
      />
    </div>
  );
}

export default App;
