function jsonValue(value) {
  if (value === undefined || value === null) return undefined;
  return JSON.parse(JSON.stringify(value));
}

export async function createAuditLog(transaction, { actorUserId, action, entityType, entityId, oldValue, newValue }) {
  return transaction.auditLog.create({
    data: {
      userId: actorUserId,
      action,
      entityType,
      entityId,
      oldValue: jsonValue(oldValue),
      newValue: jsonValue(newValue)
    }
  });
}
