import React, { useState, useCallback, useEffect } from 'react';
import { Container, Navbar, Button, Row, Col } from 'react-bootstrap';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import de from 'date-fns/locale/de';
import BrauvorgangModal from './components/BrauvorgangModal';
import TerminModal from './components/TerminModal';
import RessourcenUebersicht from './components/RessourcenUebersicht';
import YearView from './components/YearView';
import ThreeMonthsView from './components/ThreeMonthsView';
import { initialResources, brauzeiten } from './data/resources';
import { DataManager } from './utils/dataManager';
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
  const [dataManager] = useState(() => new DataManager());
  const [brauvorgaenge, setBrauvorgaenge] = useState([]);
  const [termine, setTermine] = useState([]);
  const [showBrauvorgangModal, setShowBrauvorgangModal] = useState(false);
  const [showTerminModal, setShowTerminModal] = useState(false);
  const [editingBrauvorgang, setEditingBrauvorgang] = useState(null);
  const [resources, setResources] = useState(initialResources);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('calendar');

  // Daten beim Start laden
  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await dataManager.loadFromServer();
        setBrauvorgaenge(data.brauvorgaenge || []);
        setTermine(data.termine || []);
        
        // Ressourcen aus den geladenen Daten aktualisieren
        setResources(prevResources => ({
          ...prevResources,
          gaertanks: data.gärtanks || prevResources.gaertanks,
          faesser: data.faesser || prevResources.faesser
        }));
      } catch (error) {
        console.error('Fehler beim Laden der Daten:', error);
        // Fallback zu leeren Daten
        setBrauvorgaenge([]);
        setTermine([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [dataManager]);

  const kalenderEvents = [
    ...(termine || []).map(termin => {
      const startDate = new Date(termin.startDatum);
      const endDate = new Date(termin.endDatum);
      
      return {
        id: termin.id,
        title: termin.titel || 'Unbenannter Termin',
        start: startDate,
        end: endDate,
        allDay: true,
        resource: termin,
        className: 'termin-event'
      };
    }),
    ...(brauvorgaenge || []).map(brauvorgang => {
      const dauer = brauzeiten[brauvorgang.brauart].tage;
      const startDate = new Date(brauvorgang.startDatum);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + dauer);
      
      return {
        id: brauvorgang.id,
        title: `${brauvorgang.titel} - ${brauvorgang.gaertankName}`,
        start: startDate,
        end: endDate,
        allDay: true,
        resource: brauvorgang,
        className: 'brauvorgang-event'
      };
    })
  ];

  const handleBrauvorgangSave = useCallback((brauvorgang) => {
    if (editingBrauvorgang) {
      // Update existing brauvorgang
      setBrauvorgaenge(prev => {
        const updated = prev.map(b => b.id === brauvorgang.id ? brauvorgang : b);
        dataManager.updateBrauvorgang(brauvorgang.id, brauvorgang);
        return updated;
      });
      setEditingBrauvorgang(null);
    } else {
      // Add new brauvorgang
      setBrauvorgaenge(prev => {
        const neueBrauvorgaenge = [...prev, brauvorgang];
        dataManager.addBrauvorgang(brauvorgang);
        return neueBrauvorgaenge;
      });
    }
  }, [dataManager, editingBrauvorgang]);

  const handleTerminSave = useCallback((termin) => {
    setTermine(prev => {
      const neueTermine = [...prev, termin];
      dataManager.addTermin(termin);
      return neueTermine;
    });
  }, [dataManager]);

  const handleEventClick = useCallback((event) => {
    if (event.resource.typ === 'brauvorgang') {
      const brauvorgang = event.resource;
      setEditingBrauvorgang(brauvorgang);
      setShowBrauvorgangModal(true);
    } else {
      const termin = event.resource;
      alert(`Termin Details:\n\nTitel: ${termin.titel}\nStart: ${termin.startDatum.toLocaleString()}\nEnde: ${termin.endDatum.toLocaleString()}\nBeschreibung: ${termin.beschreibung || 'Keine'}`);
    }
  }, []);

  return (
    <div>
      {isLoading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Laden...</span>
          </div>
        </div>
      ) : (
        <>
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
            <div className="view-selector mb-3">
              <Button 
                variant={currentView === 'calendar' ? 'primary' : 'outline-primary'}
                onClick={() => setCurrentView('calendar')}
                className="me-2"
              >
                Kalender
              </Button>
              <Button 
                variant={currentView === 'year' ? 'primary' : 'outline-primary'}
                onClick={() => setCurrentView('year')}
                className="me-2"
              >
                Jahresansicht
              </Button>
              <Button 
                variant={currentView === '3months' ? 'primary' : 'outline-primary'}
                onClick={() => setCurrentView('3months')}
              >
                3 Monate
              </Button>
            </div>
            
            <Row>
              <Col lg={8}>
                <div className="calendar-container">
                  {currentView === 'calendar' ? (
                    <Calendar
                      localizer={localizer}
                      events={kalenderEvents}
                      startAccessor="start"
                      endAccessor="end"
                      style={{ height: '600px' }}
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
                  ) : currentView === 'year' ? (
                    <YearView events={kalenderEvents} currentDate={new Date()} onSelectEvent={handleEventClick} />
                  ) : currentView === '3months' ? (
                    <ThreeMonthsView events={kalenderEvents} currentDate={new Date()} onSelectEvent={handleEventClick} />
                  ) : null}
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
            handleClose={() => {
              setShowBrauvorgangModal(false);
              setEditingBrauvorgang(null);
            }}
            resources={resources}
            brauvorgaenge={brauvorgaenge}
            onSave={handleBrauvorgangSave}
            editingBrauvorgang={editingBrauvorgang}
          />

          <TerminModal
            show={showTerminModal}
            handleClose={() => setShowTerminModal(false)}
            onSave={handleTerminSave}
          />
        </>
      )}
    </div>
  );
}

export default App;
