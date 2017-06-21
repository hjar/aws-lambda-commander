exports.handler = (event, context, callback) => {
    if (!event.instanceId
     || !event.commands) {
         callback('Missing parameters', event);

        return;
    }

    var aws = require('aws-sdk');
    var ssm = new aws.SSM();

    ssm.sendCommand({
        DocumentName: 'AWS-RunShellScript',
        InstanceIds: [
            event.instanceId
        ],
        Parameters: {
            'commands': event.commands
        }
    }, function(err, data) {
        if (err) {
            console.log(err, err.stack);
        }
    });
};
