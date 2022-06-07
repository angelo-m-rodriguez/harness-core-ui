const mockData = {
  failure: {
    identifier: 'failureIdentifier',
    host: 'localhost',
    tags: ['tag1'],
    status: {
      status: 'FAILURE'
    }
  },
  unknownType: {
    identifier: 'unknownIdentifier',
    host: '1.2.3.4',
    tags: ['tag2'],
    status: {
      status: 'UNKNOWN'
    }
  },
  success: {
    identifier: 'successIdentifier',
    host: '2.2.2.2',
    tags: ['tag3'],
    status: {
      status: 'SUCCESS'
    }
  },
  failureWithErrorSummary: {
    identifier: 'failureIdentifier',
    host: 'localhost',
    tags: ['tag1'],
    status: {
      status: 'FAILURE',
      errorSummary: 'ErrorSummaryStatus'
    }
  }
}

export default mockData
