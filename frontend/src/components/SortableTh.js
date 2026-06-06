import React from 'react';

export default function SortableTh({ field, label, sort, order, onSort }) {
  const active = sort === field;
  return (
    <th className={active ? 'sorted' : ''} onClick={() => onSort(field)}>
      <span className="th-inner">
        {label}
        <span style={{ opacity: active ? 1 : 0.3, fontSize: 10 }}>
          {active && order === 'ASC' ? '↑' : '↓'}
        </span>
      </span>
    </th>
  );
}
