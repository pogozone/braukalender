import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Alert } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ResourceManager } from '../utils/resourceManager';
import { brauzeiten } from '../data/resources';

const BrauvorgangModal = ({ show, handleClose, resources, brauvorgaenge, onSave, onDelete, editingBrauvorgang }) => {
  const [titel, setTitel] = useState('');
  const [startDatum, setStartDatum] = useState(new Date());
  const [brauart, setBrauart] = useState('obergärig');
  const [umdrueckDatum, setUmdrueckDatum] = useState(new Date());
  const [fehlermeldung, setFehlermeldung] = useState('');

  // Helper function to get fresh resource manager
  const getResourceManager = () => new ResourceManager(resources, brauvorgaenge);

  useEffect(() => {
    if (show) {
      if (editingBrauvorgang) {
        // Edit mode: populate form with existing data
        setTitel(editingBrauvorgang.titel);
        setStartDatum(new Date(editingBrauvorgang.startDatum));
        setBrauart(editingBrauvorgang.brauart);
        setUmdrueckDatum(editingBrauvorgang.umdrueckDatum ? new Date(editingBrauvorgang.umdrueckDatum) : new Date());
      } else {
        // New mode: reset form
        setTitel('');
        setStartDatum(new Date());
        setBrauart('obergärig');
        setUmdrueckDatum(new Date());
      }
      setFehlermeldung('');
    }
  }, [show, editingBrauvorgang]);

  useEffect(() => {
    // Update umdrueckDatum when brauart changes
    if (show) {
      const dauer = brauzeiten[brauart].tage;
      const neuesUmdrueckDatum = new Date(startDatum);
      neuesUmdrueckDatum.setDate(neuesUmdrueckDatum.getDate() + dauer);
      setUmdrueckDatum(neuesUmdrueckDatum);
    }
  }, [brauart, startDatum, show]);

  const handleSave = () => {
    setFehlermeldung('');

    if (!titel.trim()) {
      setFehlermeldung('Bitte geben Sie einen Titel ein');
      return;
    }

    const resourceManager = getResourceManager();
    const gaertankVerfuegbar = resourceManager.pruefeGaertankVerfuegbarkeit(startDatum, brauart, editingBrauvorgang?.id);
    const faesserVerfuegbar = resourceManager.pruefeFaesserVerfuegbarkeit(startDatum, brauart, editingBrauvorgang?.id);

    if (!gaertankVerfuegbar && !faesserVerfuegbar) {
      setFehlermeldung('Kein Gärtank frei und nicht genug Fässer verfügbar');
      return;
    }

    if (!gaertankVerfuegbar) {
      setFehlermeldung('Kein Gärtank frei');
      return;
    }

    if (!faesserVerfuegbar) {
      setFehlermeldung('Nicht genug Fässer verfügbar');
      return;
    }

    const gaertank = resourceManager.getVerfuegbarenGaertank(startDatum, brauart, editingBrauvorgang?.id);
    const faesser = resourceManager.getVerfuegbareFaesser(startDatum, brauart, editingBrauvorgang?.id);

    const brauvorgang = {
      id: editingBrauvorgang ? editingBrauvorgang.id : Date.now(),
      titel,
      startDatum,
      brauart,
      umdrueckDatum,
      gaertankId: gaertank.id,
      gaertankName: gaertank.name,
      belegteFaesser: faesser.map(f => f.id),
      faesserNamen: faesser.map(f => f.name),
      typ: 'brauvorgang'
    };

    onSave(brauvorgang);
    handleClose();
  };

  const handleDelete = () => {
    if (editingBrauvorgang && window.confirm(`Möchten Sie den Brauvorgang "${editingBrauvorgang.titel}" wirklich löschen?`)) {
      onDelete(editingBrauvorgang.id);
      handleClose();
    }
  };

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{editingBrauvorgang ? 'Brauvorgang bearbeiten' : 'Neuer Brauvorgang'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {fehlermeldung && <Alert variant="danger">{fehlermeldung}</Alert>}
        
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Titel</Form.Label>
            <Form.Control
              type="text"
              value={titel}
              onChange={(e) => setTitel(e.target.value)}
              placeholder="Titel des Brauvorgangs eingeben"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Startdatum</Form.Label>
            <DatePicker
              selected={startDatum}
              onChange={setStartDatum}
              className="form-control"
              dateFormat="dd.MM.yyyy"
              minDate={new Date()}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Brauart</Form.Label>
            <Form.Select
              value={brauart}
              onChange={(e) => setBrauart(e.target.value)}
            >
              <option value="obergärig">Obergärig (14 Tage)</option>
              <option value="untergärig">Untergärig (10 Tage)</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Umdrücken</Form.Label>
            <DatePicker
              selected={umdrueckDatum}
              onChange={setUmdrueckDatum}
              className="form-control"
              dateFormat="dd.MM.yyyy"
              minDate={startDatum}
            />
            <Form.Text className="text-muted">
              Datum für das Umdrücken (Standard: {brauzeiten[brauart].tage} Tage nach Start)
            </Form.Text>
          </Form.Group>

          <div className="mb-3">
            <h6>Benötigte Ressourcen:</h6>
            <ul>
              <li>1 Gärtank für {brauzeiten[brauart].tage} Tage</li>
              <li>3 Fässer für {brauzeiten[brauart].tage} Tage</li>
            </ul>
          </div>

          <div className="resource-status">
            <h6>Verfügbarkeitsprüfung:</h6>
            {getResourceManager().pruefeGaertankVerfuegbarkeit(startDatum, brauart, editingBrauvorgang?.id) ? (
              <div className="resource-available">
                ✓ Gärtank verfügbar
              </div>
            ) : (
              <div className="resource-unavailable">
                ✗ Kein Gärtank verfügbar
              </div>
            )}
            {getResourceManager().pruefeFaesserVerfuegbarkeit(startDatum, brauart, editingBrauvorgang?.id) ? (
              <div className="resource-available">
                ✓ Genug Fässer verfügbar
              </div>
            ) : (
              <div className="resource-unavailable">
                ✗ Nicht genug Fässer verfügbar
              </div>
            )}
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Abbrechen
        </Button>
        {editingBrauvorgang && (
          <Button variant="danger" onClick={handleDelete}>
            Löschen
          </Button>
        )}
        <Button 
          variant="success" 
          onClick={handleSave}
          disabled={!titel.trim() || 
                   !getResourceManager().pruefeGaertankVerfuegbarkeit(startDatum, brauart, editingBrauvorgang?.id) || 
                   !getResourceManager().pruefeFaesserVerfuegbarkeit(startDatum, brauart, editingBrauvorgang?.id)}
        >
          {editingBrauvorgang ? 'Brauvorgang aktualisieren' : 'Brauvorgang speichern'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BrauvorgangModal;
