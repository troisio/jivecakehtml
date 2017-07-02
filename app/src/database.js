import lf from 'lovefield';

const builder = lf.schema.create('jivecake', 1);

builder.createTable('Permission')
  .addColumn('id', lf.Type.STRING)
  .addColumn('user_id', lf.Type.STRING)
  .addColumn('objectId', lf.Type.STRING)
  .addColumn('include', lf.Type.INTEGER)
  .addColumn('objectClass', lf.Type.STRING)
  .addColumn('permissions', lf.Type.ARRAY_BUFFER)
  .addColumn('timeCreated', lf.Type.INTEGER)
  .addUnique('unique', ['objectClass', 'objectId', 'user_id'])
  .addPrimaryKey(['id']);

builder.createTable('Organization')
  .addColumn('id', lf.Type.STRING)
  .addColumn('parentId', lf.Type.STRING)
  .addColumn('children', lf.Type.ARRAY_BUFFER)
  .addColumn('name', lf.Type.STRING)
  .addColumn('email', lf.Type.STRING)
  .addColumn('timeUpdated', lf.Type.INTEGER)
  .addColumn('timeCreated', lf.Type.INTEGER)
  .addColumn('lastActivity', lf.Type.INTEGER)
  .addNullable(['parentId', 'timeUpdated', 'lastActivity'])
  .addPrimaryKey(['id']);

builder.createTable('Event')
  .addColumn('id', lf.Type.STRING)
  .addColumn('name', lf.Type.STRING)
  .addColumn('description', lf.Type.STRING)
  .addColumn('status', lf.Type.STRING)
  .addColumn('organizationId', lf.Type.STRING)
  .addColumn('paymentProfileId', lf.Type.STRING)
  .addColumn('currency', lf.Type.STRING)
  .addColumn('timeStart', lf.Type.INTEGER)
  .addColumn('timeEnd', lf.Type.INTEGER)
  .addColumn('timeCreated', lf.Type.INTEGER)
  .addColumn('timeUpdated', lf.Type.INTEGER)
  .addColumn('lastActivity', lf.Type.INTEGER)
  .addNullable([
    'paymentProfileId',
    'description',
    'currency',
    'timeUpdated',
    'timeStart',
    'timeEnd'
  ])
  .addPrimaryKey(['id']);

builder.createTable('Item')
  .addColumn('id', lf.Type.STRING)
  .addColumn('eventId', lf.Type.STRING)
  .addColumn('organizationId', lf.Type.STRING)
  .addColumn('name', lf.Type.STRING)
  .addColumn('description', lf.Type.STRING)
  .addColumn('totalAvailible', lf.Type.INTEGER)
  .addColumn('maximumPerUser', lf.Type.INTEGER)
  .addColumn('amount', lf.Type.INTEGER)
  .addColumn('timeAmounts', lf.Type.ARRAY_BUFFER)
  .addColumn('countAmounts', lf.Type.ARRAY_BUFFER)
  .addColumn('status', lf.Type.INTEGER)
  .addColumn('timeStart', lf.Type.INTEGER)
  .addColumn('timeEnd', lf.Type.INTEGER)
  .addColumn('timeUpdated', lf.Type.INTEGER)
  .addColumn('timeCreated', lf.Type.INTEGER)
  .addColumn('lastActivity', lf.Type.INTEGER)
  .addForeignKey('ItemToEventForeignKey', {
    local: 'eventId',
    ref: 'Event.id',
    action: lf.ConstraintAction.CASCADE
  })
  .addNullable([
    'timeUpdated',
    'timeStart',
    'timeEnd',
    'countAmounts',
    'timeAmounts',
    'maximumPerUser',
    'totalAvailible',
    'description',
    'name'
  ])
  .addPrimaryKey(['id']);

builder.createTable('Transaction')
  .addColumn('id', lf.Type.STRING)
  .addColumn('parentTransactionId', lf.Type.STRING)
  .addColumn('itemId', lf.Type.STRING)
  .addColumn('eventId', lf.Type.STRING)
  .addColumn('organizationId', lf.Type.STRING)
  .addColumn('user_id', lf.Type.STRING)
  .addColumn('linkedId', lf.Type.STRING)
  .addColumn('linkedIdString', lf.Type.STRING)
  .addColumn('linkedObjectClass', lf.Type.STRING)
  .addColumn('status', lf.Type.INTEGER)
  .addColumn('paymentStatus', lf.Type.INTEGER)
  .addColumn('quantity', lf.Type.INTEGER)
  .addColumn('given_name', lf.Type.STRING)
  .addColumn('middleName', lf.Type.STRING)
  .addColumn('family_name', lf.Type.STRING)
  .addColumn('amount', lf.Type.NUMBER)
  .addColumn('currency', lf.Type.STRING)
  .addColumn('email', lf.Type.STRING)
  .addColumn('leaf', lf.Type.BOOLEAN)
  .addColumn('timeCreated', lf.Type.INTEGER)
  .addForeignKey('TransactionToItemForeignKey', {
    local: 'itemId',
    ref: 'Item.id',
    action: lf.ConstraintAction.CASCADE
  })
  .addNullable([
    'parentTransactionId',
    'user_id',
    'linkedId',
    'linkedIdString',
    'linkedObjectClass',
    'given_name',
    'middleName',
    'family_name',
    'email'
  ])
  .addPrimaryKey(['id'])
  .addIndex('timeCreatedIndex', ['timeCreated'], false, lf.Order.DESC);

builder.createTable('User')
  .addColumn('user_id', lf.Type.STRING)
  .addColumn('email', lf.Type.STRING)
  .addColumn('name', lf.Type.STRING)
  .addColumn('nickname', lf.Type.STRING)
  .addColumn('user_metadata', lf.Type.OBJECT)
  .addColumn('given_name', lf.Type.STRING)
  .addColumn('family_name', lf.Type.STRING)
  .addColumn('picture', lf.Type.STRING)
  .addNullable(['given_name', 'family_name', 'email', 'user_metadata'])
  .addPrimaryKey(['user_id']);

  builder.createTable('PaypalPaymentProfile')
    .addColumn('id', lf.Type.STRING)
    .addColumn('organizationId', lf.Type.STRING)
    .addColumn('email', lf.Type.STRING)
    .addColumn('stripe_publishable_key', lf.Type.STRING)
    .addColumn('stripe_user_id', lf.Type.STRING)
    .addColumn('timeCreated', lf.Type.INTEGER)
    .addNullable(['stripe_publishable_key', 'stripe_user_id', 'email'])
    .addPrimaryKey(['id']);

builder.createTable('EntityAsset')
  .addColumn('id', lf.Type.STRING)
  .addColumn('entityId', lf.Type.STRING)
  .addColumn('entityType', lf.Type.STRING)
  .addColumn('assetId', lf.Type.STRING)
  .addColumn('assetType', lf.Type.STRING)
  .addColumn('data', lf.Type.ARRAY_BUFFER)
  .addColumn('timeCreated', lf.Type.INTEGER)
  .addNullable(['data'])
  .addPrimaryKey(['id']);

export default builder;