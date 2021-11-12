import RichDestinyText from 'app/dim-ui/RichDestinyText';
import { DimItem } from 'app/inventory/item-types';
import ItemPopupTrigger from 'app/inventory/ItemPopupTrigger';
import { isNewSelector } from 'app/inventory/selectors';
import { isBooleanObjective } from 'app/inventory/store/objectives';
import ItemExpiration from 'app/item-popup/ItemExpiration';
import { useD2Definitions } from 'app/manifest/selectors';
import { searchFilterSelector } from 'app/search/search-filter';
import { percent } from 'app/shell/filters';
import { RootState } from 'app/store/types';
import clsx from 'clsx';
import React from 'react';
import { useSelector } from 'react-redux';
import { ObjectiveValue } from './Objective';
import PursuitItem from './PursuitItem';

// Props provided from parents
interface Props {
  item: DimItem;
  hideDescription?: boolean;
  searchHidden?: boolean;
}

/**
 * A Pursuit is an inventory item that represents a bounty or quest. This displays
 * a pursuit tile for the Progress page.
 */
export default function Pursuit({
  item,
  hideDescription,
  searchHidden: alreadySearchHidden,
}: Props) {
  const defs = useD2Definitions()!;
  const isNew = useSelector(isNewSelector(item));
  const searchHidden = useSelector(
    (state: RootState) => alreadySearchHidden || !searchFilterSelector(state)(item)
  );
  const expired = showPursuitAsExpired(item);

  const objectives = item.objectives || [];

  const firstObjective = objectives.length > 0 ? objectives[0] : undefined;
  const firstObjectiveDef = firstObjective && defs.Objective.get(firstObjective.objectiveHash);
  const isBoolean =
    firstObjective &&
    firstObjectiveDef &&
    isBooleanObjective(firstObjectiveDef, firstObjective.completionValue);
  const showObjectiveDetail = objectives.length === 1 && !isBoolean;

  const showObjectiveProgress = objectives.length > 1 || (objectives.length === 1 && !isBoolean);

  return (
    <ItemPopupTrigger item={item}>
      {(ref, onClick) => (
        <div
          className={clsx('milestone-quest', { 'search-hidden': searchHidden })}
          key={item.index}
          onClick={onClick}
        >
          <div className="milestone-icon">
            <PursuitItem item={item} isNew={isNew} ref={ref} />
            {!item.complete && !expired && showObjectiveProgress && firstObjective && (
              <span>
                {item.objectives && showObjectiveDetail ? (
                  <ObjectiveValue
                    objectiveDef={defs.Objective.get(firstObjective.objectiveHash)}
                    progress={firstObjective.progress || 0}
                    completionValue={firstObjective.completionValue}
                  />
                ) : (
                  percent(item.percentComplete)
                )}
              </span>
            )}
          </div>
          {!hideDescription && (
            <div className="milestone-info">
              <span className="milestone-name">
                <ItemExpiration item={item} compact={true} />
                {item.name}
              </span>
              <div className="milestone-description">
                <RichDestinyText text={item.description} ownerId={item.owner} />
              </div>
            </div>
          )}
        </div>
      )}
    </ItemPopupTrigger>
  );
}

/**
 * Should this item be displayed as expired (no longer completable)?
 */
export function showPursuitAsExpired(item: DimItem) {
  // Suppress description when expiration is shown
  const suppressExpiration =
    item.pursuit?.suppressExpirationWhenObjectivesComplete && item.complete;

  const expired =
    !suppressExpiration && item.pursuit?.expirationDate
      ? item.pursuit.expirationDate.getTime() < Date.now()
      : false;

  return expired;
}
