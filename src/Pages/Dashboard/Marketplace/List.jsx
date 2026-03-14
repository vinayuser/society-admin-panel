import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  CardBody,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Nav,
  NavItem,
  NavLink,
  Badge,
} from 'reactstrap';
import axiosInstance from '../../../config/axiosInstance';
import ENDPOINTS from '../../../config/apiUrls';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_URL || '';

const CATEGORIES = ['furniture', 'electronics', 'appliances', 'books', 'services', 'other'];
const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
];

function ItemCard({ item, onPin, onStatus, onListedGlobally, onDelete, onView, isGlobal }) {
  const urls = item.mediaUrls && item.mediaUrls.length ? item.mediaUrls : (item.imageUrl ? [item.imageUrl] : []);
  const imgSrc = urls[0] ? (urls[0].startsWith('http') ? urls[0] : `${API_BASE}${urls[0]}`) : null;
  return (
    <Card className="marketplace-card h-100">
      <div className="position-relative">
        <div className="marketplace-card-img" style={{ height: 160, background: '#f0f0f0' }}>
          {imgSrc ? (
            <img src={imgSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 text-muted small">No image</div>
          )}
        </div>
        {item.isPinned && (
          <Badge color="warning" className="position-absolute top-0 start-0 m-2">Pinned</Badge>
        )}
        {item.listedGlobally && !isGlobal && (
          <Badge color="info" className="position-absolute top-0 end-0 m-2">Global</Badge>
        )}
      </div>
      <CardBody className="p-3">
        <h6 className="mb-1 text-truncate" title={item.title}>{item.title}</h6>
        <p className="mb-1 fw-semibold text-primary">
          {item.price != null ? `₹${Number(item.price).toLocaleString()}` : 'Price on request'}
        </p>
        <p className="mb-2 small text-muted">{item.sellerName || '-'}</p>
        {item.societyName && <p className="mb-2 small text-muted">{item.societyName}</p>}
        <div className="d-flex flex-wrap gap-1 mb-2">
          {item.category && <Badge bg="secondary">{item.category}</Badge>}
          {item.itemCondition && <Badge bg="light" text="dark">{item.itemCondition}</Badge>}
          <Badge className={item.status === 'active' ? 'bg-success' : item.status === 'sold' ? 'bg-secondary' : 'bg-danger'}>{item.status}</Badge>
        </div>
        <div className="d-flex flex-wrap gap-1">
          <Button size="sm" color="primary" outline className="rounded-2" onClick={() => onView(item)}>View</Button>
          {!isGlobal && item.status === 'active' && (
            <>
              <Button size="sm" color="warning" outline className="rounded-2" onClick={() => onPin(item)}>{item.isPinned ? 'Unpin' : 'Pin'}</Button>
              <Button size="sm" color="secondary" outline className="rounded-2" onClick={() => onStatus(item, 'sold')}>Mark sold</Button>
              <Button size="sm" color="info" outline className="rounded-2" onClick={() => onListedGlobally(item)}>{item.listedGlobally ? 'Remove from global' : 'List globally'}</Button>
            </>
          )}
          {!isGlobal && <Button size="sm" color="danger" outline className="rounded-2" onClick={() => onDelete(item)}>Delete</Button>}
        </div>
      </CardBody>
    </Card>
  );
}

const MarketplaceList = () => {
  const [activeTab, setActiveTab] = useState('community');
  const [list, setList] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [sort, setSort] = useState('newest');
  const [viewModal, setViewModal] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTx, setLoadingTx] = useState(false);

  const fetchCommunity = (page = 1) => {
    setLoading(true);
    const params = { page, limit: 12 };
    if (filterCategory) params.category = filterCategory;
    if (filterStatus && filterStatus !== '') params.status = filterStatus;
    if (filterMinPrice !== '') params.minPrice = filterMinPrice;
    if (filterMaxPrice !== '') params.maxPrice = filterMaxPrice;
    if (filterCondition) params.condition = filterCondition;
    axiosInstance.get(ENDPOINTS.MARKETPLACE.LIST, { params })
      .then((res) => {
        setList(res.data?.data ?? []);
        setPagination(res.data?.pagination ?? { page: 1, limit: 12, total: 0 });
      })
      .catch(() => {
        toast.error('Failed to load items');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  const fetchGlobal = (page = 1) => {
    setLoading(true);
    const params = { page, limit: 12, sort };
    if (filterCategory) params.category = filterCategory;
    if (filterMinPrice !== '') params.minPrice = filterMinPrice;
    if (filterMaxPrice !== '') params.maxPrice = filterMaxPrice;
    if (filterCondition) params.condition = filterCondition;
    axiosInstance.get(ENDPOINTS.MARKETPLACE.LIST_GLOBAL, { params })
      .then((res) => {
        setList(res.data?.data ?? []);
        setPagination(res.data?.pagination ?? { page: 1, limit: 12 });
      })
      .catch(() => {
        toast.error('Failed to load global marketplace');
        setList([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'community') fetchCommunity(1);
    else fetchGlobal(1);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'community') fetchCommunity(1);
  }, [filterCategory, filterStatus, filterMinPrice, filterMaxPrice, filterCondition]);

  useEffect(() => {
    if (activeTab === 'global') fetchGlobal(1);
  }, [sort]);

  useEffect(() => {
    if (activeTab === 'transactions') {
      setLoadingTx(true);
      axiosInstance.get(ENDPOINTS.MARKETPLACE.TRANSACTIONS)
        .then((res) => setTransactions(res.data?.data ?? []))
        .catch(() => setTransactions([]))
        .finally(() => setLoadingTx(false));
    }
  }, [activeTab]);

  const handlePin = (item) => {
    axiosInstance.patch(ENDPOINTS.MARKETPLACE.PIN(item.id), { isPinned: !item.isPinned })
      .then((res) => {
        if (res.data?.success) {
          toast.success(item.isPinned ? 'Unpinned' : 'Pinned');
          if (activeTab === 'community') fetchCommunity(pagination.page);
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const handleStatus = (item, status) => {
    axiosInstance.patch(ENDPOINTS.MARKETPLACE.UPDATE_STATUS(item.id), { status })
      .then((res) => {
        if (res.data?.success) {
          toast.success('Status updated');
          if (activeTab === 'community') fetchCommunity(pagination.page);
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const handleListedGlobally = (item) => {
    axiosInstance.patch(ENDPOINTS.MARKETPLACE.LISTED_GLOBALLY(item.id), { listedGlobally: !item.listedGlobally })
      .then((res) => {
        if (res.data?.success) {
          toast.success(item.listedGlobally ? 'Removed from global' : 'Listed globally');
          if (activeTab === 'community') fetchCommunity(pagination.page);
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'));
  };

  const handleDelete = (item) => {
    if (!window.confirm(`Remove "${item.title}"?`)) return;
    setDeleteId(item.id);
    axiosInstance.delete(ENDPOINTS.MARKETPLACE.DELETE(item.id))
      .then((res) => {
        if (res.data?.success) {
          toast.success('Listing removed');
          if (activeTab === 'community') fetchCommunity(pagination.page);
        }
      })
      .catch((err) => toast.error(err.response?.data?.message || 'Failed'))
      .finally(() => setDeleteId(null));
  };

  const item = viewModal;
  const viewUrls = item?.mediaUrls?.length ? item.mediaUrls : (item?.imageUrl ? [item.imageUrl] : []);

  return (
    <div>
      <div className="page-header">
        <h1>Marketplace</h1>
        <p className="page-subtitle mb-0">
          Community marketplace (society-only) and global marketplace (across societies). Pin, list globally, and moderate items.
        </p>
      </div>

      <Nav pills className="nav-pills-custom mb-4">
        <NavItem>
          <NavLink active={activeTab === 'community'} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('community'); }}>
            Community Marketplace
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink active={activeTab === 'global'} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('global'); }}>
            Global Marketplace
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink active={activeTab === 'transactions'} href="#" onClick={(e) => { e.preventDefault(); setActiveTab('transactions'); }}>
            Transactions
          </NavLink>
        </NavItem>
      </Nav>

      <Card className="mb-4">
        <CardBody>
          <div className="row g-3 align-items-end">
            <div className="col-md-2">
              <label className="form-label small">Category</label>
              <Input type="select" className="form-select form-select-sm" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Input>
            </div>
            {activeTab === 'community' && (
              <div className="col-md-2">
                <label className="form-label small">Status</label>
                <Input type="select" className="form-select form-select-sm" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All</option>
                  <option value="active">Active</option>
                  <option value="sold">Sold</option>
                  <option value="removed">Removed</option>
                </Input>
              </div>
            )}
            <div className="col-md-2">
              <label className="form-label small">Condition</label>
              <Input type="select" className="form-select form-select-sm" value={filterCondition} onChange={(e) => setFilterCondition(e.target.value)}>
                <option value="">All</option>
                <option value="new">New</option>
                <option value="used">Used</option>
              </Input>
            </div>
            <div className="col-md-2">
              <label className="form-label small">Min price</label>
              <Input type="number" className="form-control form-control-sm" placeholder="Min" value={filterMinPrice} onChange={(e) => setFilterMinPrice(e.target.value)} min={0} />
            </div>
            <div className="col-md-2">
              <label className="form-label small">Max price</label>
              <Input type="number" className="form-control form-control-sm" placeholder="Max" value={filterMaxPrice} onChange={(e) => setFilterMaxPrice(e.target.value)} min={0} />
            </div>
            {activeTab === 'global' && (
              <div className="col-md-2">
                <label className="form-label small">Sort</label>
                <Input type="select" className="form-select form-select-sm" value={sort} onChange={(e) => setSort(e.target.value)}>
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </Input>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {activeTab === 'transactions' ? (
        loadingTx ? (
          <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
        ) : (
          <Card className="table-card">
            <CardBody>
              {transactions.length === 0 ? (
                <p className="text-muted mb-0 text-center py-4">No transactions yet.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Buyer</th>
                        <th>Seller</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id}>
                          <td>{tx.itemTitle} {tx.itemPrice != null ? `(₹${Number(tx.itemPrice).toLocaleString()})` : ''}</td>
                          <td>{tx.buyerName}</td>
                          <td>{tx.sellerName}</td>
                          <td><Badge className={tx.transactionStatus === 'completed' ? 'bg-success' : tx.transactionStatus === 'canceled' ? 'bg-danger' : 'bg-warning'}>{tx.transactionStatus}</Badge></td>
                          <td>{tx.createdAt ? new Date(tx.createdAt).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardBody>
          </Card>
        )
      ) : loading ? (
        <div className="d-flex justify-content-center py-5"><Spinner color="primary" /></div>
      ) : (
        <>
          <div className="row g-4">
            {list.map((row) => (
              <div key={row.id} className="col-sm-6 col-lg-4 col-xl-3">
                <ItemCard
                  item={row}
                  isGlobal={activeTab === 'global'}
                  onPin={handlePin}
                  onStatus={handleStatus}
                  onListedGlobally={handleListedGlobally}
                  onDelete={handleDelete}
                  onView={setViewModal}
                />
              </div>
            ))}
          </div>
          {list.length === 0 && (
            <Card>
              <CardBody className="text-center text-muted py-5">
                {activeTab === 'community' ? 'No community items found.' : 'No global listings yet. List community items globally to see them here.'}
              </CardBody>
            </Card>
          )}
          {pagination.total > pagination.limit && activeTab === 'community' && (
            <div className="d-flex justify-content-center mt-3">
              <Button color="secondary" outline className="rounded-2 me-2" disabled={pagination.page <= 1} onClick={() => fetchCommunity(pagination.page - 1)}>Previous</Button>
              <span className="align-self-center mx-2">Page {pagination.page}</span>
              <Button color="secondary" outline className="rounded-2" disabled={pagination.page * pagination.limit >= pagination.total} onClick={() => fetchCommunity(pagination.page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}

      <Modal isOpen={!!viewModal} toggle={() => setViewModal(null)} size="lg">
        <ModalHeader toggle={() => setViewModal(null)}>{item?.title}</ModalHeader>
        <ModalBody>
          {item && (
            <>
              {viewUrls.length > 0 && (
                <div className="mb-3">
                  <img src={viewUrls[0].startsWith('http') ? viewUrls[0] : `${API_BASE}${viewUrls[0]}`} alt="" className="img-fluid rounded" style={{ maxHeight: 300 }} />
                </div>
              )}
              <p className="text-muted mb-2">{item.description || 'No description.'}</p>
              <p><strong>Price:</strong> {item.price != null ? `₹${Number(item.price).toLocaleString()}` : 'On request'}</p>
              <p><strong>Seller:</strong> {item.sellerName}</p>
              {item.societyName && <p><strong>Society:</strong> {item.societyName}</p>}
              <p><strong>Category:</strong> {item.category || '-'} · <strong>Condition:</strong> {item.itemCondition || '-'}</p>
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default MarketplaceList;
