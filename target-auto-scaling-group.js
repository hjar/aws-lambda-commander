exports.handler = (event, context, callback) => {
    if (!event.autoScalingGroup
     || !event.commands) {
         callback('Missing parameters', event);

        return;
    }

    var aws = require('aws-sdk');
    var autoScaling = new aws.AutoScaling();
    var ssm = new aws.SSM();

    autoScaling.describeAutoScalingGroups({
        AutoScalingGroupNames: [
            event.autoScalingGroup
        ]
    }, function(err, data) {
        if (err) {
            console.log(err, err.stack);

            return;
        }

        var targets = [];

        var instances = data.AutoScalingGroups[0].Instances;

        for (var i = 0; i < instances.length; i++) {
            var instance = instances[i];

            if (instance.LifecycleState != 'InService'
             || instance.HealthStatus != 'Healthy') {
                 continue;
            }

            targets.push(instance.InstanceId);
        }

        var randomIndex = Math.floor(Math.random() * targets.length);

        ssm.sendCommand({
            DocumentName: 'AWS-RunShellScript',
            InstanceIds: [
                targets[randomIndex]
            ],
            Parameters: {
                'commands': event.commands
            }
        }, function(err, data) {
            if (err) {
                console.log(err, err.stack);
            }
        });
    });
};
