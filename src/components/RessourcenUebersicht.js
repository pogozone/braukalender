import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';
import { ResourceManager } from '../utils/resourceManager';

const RessourcenUebersicht = ({ resources, brauvorgaenge }) => {
  const resourceManager = new ResourceManager(resources, brauvorgaenge);
  const status = resourceManager.getRessourcenStatus();

  const verfuegbareGaertanks = status.gaertanks.filter(t => t.status === 'verfügbar').length;
  const verfuegbareFaesser = status.faesser.filter(f => f.status === 'verfügbar').length;

  return (
    <Card className="mb-4">
      <Card.Header>
        <h5>Ressourcenübersicht</h5>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={6}>
            <h6>Gärtanks ({verfuegbareGaertanks}/{status.gaertanks.length} verfügbar)</h6>
            {status.gaertanks.map(tank => (
              <div key={tank.id} className="mb-2">
                <Badge bg={tank.status === 'verfügbar' ? 'success' : 'danger'}>
                  {tank.name}
                </Badge>
                <span className="ms-2 text-muted">{tank.status}</span>
              </div>
            ))}
          </Col>
          <Col md={6}>
            <h6>Fässer ({verfuegbareFaesser}/{status.faesser.length} verfügbar)</h6>
            <div className="mb-2">
              <Badge bg="success">Verfügbar: {verfuegbareFaesser}</Badge>
            </div>
            <div className="mb-2">
              <Badge bg="danger">Belegt: {status.faesser.length - verfuegbareFaesser}</Badge>
            </div>
            <small className="text-muted">
              Für einen Brauvorgang werden 3 Fässer benötigt
            </small>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default RessourcenUebersicht;
