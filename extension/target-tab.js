export function resolveTargetTab({ currentTab, activeTab }) {
  if (!Number.isInteger(activeTab?.id)) return null;
  if (!Number.isInteger(currentTab?.id) || activeTab.id !== currentTab.id) return activeTab;
  if (!Number.isInteger(currentTab.openerTabId)) return null;
  return { id: currentTab.openerTabId };
}
