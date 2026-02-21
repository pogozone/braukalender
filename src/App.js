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
import './components/CalendarStyles.css';

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
    ...(brauvorgaenge || []).flatMap(brauvorgang => {
      const dauer = brauzeiten[brauvorgang.brauart].tage;
      const startDate = new Date(brauvorgang.startDatum);
      const endDate = brauvorgang.umdrueckDatum ? new Date(brauvorgang.umdrueckDatum) : new Date(startDate);
      endDate.setDate(endDate.getDate() + dauer);
      
      // Haupt-Brauvorgang Event
      const brauvorgangEvent = {
        id: brauvorgang.id,
        title: `${brauvorgang.titel} - ${brauvorgang.gaertankName}`,
        start: startDate,
        end: endDate,
        allDay: true,
        resource: brauvorgang,
        className: 'brauvorgang-event'
      };
      
      // Umdrücken-Termin (falls vorhanden)
      const events = [brauvorgangEvent];
      if (brauvorgang.umdrueckDatum) {
        const umdrueckDate = new Date(brauvorgang.umdrueckDatum);
        const umdrueckEndDate = new Date(umdrueckDate);
        umdrueckEndDate.setDate(umdrueckEndDate.getDate() + 1); // 1 Tag für Umdrücken
        
        events.push({
          id: `umdrueck-${brauvorgang.id}`,
          title: `Umdrücken: ${brauvorgang.titel}`,
          start: umdrueckDate,
          end: umdrueckEndDate,
          allDay: true,
          resource: { ...brauvorgang, typ: 'umdrueck', umdrueckDatum: brauvorgang.umdrueckDatum },
          className: 'umdrueck-event'
        });
      }
      
      return events;
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

  const handleBrauvorgangDelete = useCallback((id) => {
    setBrauvorgaenge(prev => {
      const updated = prev.filter(b => b.id !== id);
      dataManager.deleteBrauvorgang(id);
      return updated;
    });
    setEditingBrauvorgang(null);
  }, [dataManager]);

  const handleTerminSave = useCallback((termin) => {
    setTermine(prev => {
      const neueTermine = [...prev, termin];
      dataManager.addTermin(termin);
      return neueTermine;
    });
  }, [dataManager]);

  const handleEventClick = useCallback((event) => {
    if (event.resource.typ === 'brauvorgang' || event.resource.typ === 'umdrueck') {
      const brauvorgang = event.resource;
      setEditingBrauvorgang(brauvorgang);
      setShowBrauvorgangModal(true);
    } else {
      const termin = event.resource;
      alert(`Termin Details:\n\nTitel: ${termin.titel}\nStart: ${termin.startDatum.toLocaleString()}\nEnde: ${termin.endDatum.toLocaleString()}\nBeschreibung: ${termin.beschreibung || 'Keine'}`);
    }
  }, []);

  const handleEventDelete = useCallback((event) => {
    if (event.resource.typ === 'brauvorgang' || event.resource.typ === 'umdrueck') {
      const brauvorgang = event.resource;
      if (window.confirm(`Möchten Sie den Brauvorgang "${brauvorgang.titel}" wirklich löschen?`)) {
        handleBrauvorgangDelete(brauvorgang.id);
      }
    } else {
      const termin = event.resource;
      if (window.confirm(`Möchten Sie den Termin "${termin.titel}" wirklich löschen?`)) {
        // TODO: Implement termin deletion
        alert('Termin-Löschung noch nicht implementiert');
      }
    }
  }, [handleBrauvorgangDelete]);

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
                      onSelectEvent={handleEventClick}
                      onDoubleClickEvent={handleEventDelete}
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
                      eventPropGetter={(event) => ({
                        className: event.className
                      })}
                    />
                  ) : currentView === 'year' ? (
                    <YearView events={kalenderEvents} currentDate={new Date()} onSelectEvent={handleEventClick} onDoubleClickEvent={handleEventDelete} />
                  ) : currentView === '3months' ? (
                    <ThreeMonthsView events={kalenderEvents} currentDate={new Date()} onSelectEvent={handleEventClick} onDoubleClickEvent={handleEventDelete} />
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
            onDelete={handleBrauvorgangDelete}
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
