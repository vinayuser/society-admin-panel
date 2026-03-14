import React, { useState, useEffect } from 'react';
import { Card, CardBody, Table, Spinner } from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';

const AdsList = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get(ENDPOINTS.ADS.LIST).then((res) => {
      setList(Array.isArray(res.data?.data) ? res.data.data : []);
    }).catch(() => setList([])).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Advertisements</h1>
        <p className="page-subtitle mb-0">Manage society advertisements and campaigns.</p>
      </div>
      <Card className="table-card">
        <CardBody>
          {loading ? <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div> : (
            <Table responsive hover className="table-striped">
              <thead><tr><th>Title</th><th>Type</th><th>Start</th><th>End</th></tr></thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row.id}>
                    <td>{row.title || '-'}</td>
                    <td>{row.type}</td>
                    <td>{row.startDate ? new Date(row.startDate).toLocaleDateString() : '-'}</td>
                    <td>{row.endDate ? new Date(row.endDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AdsList;
